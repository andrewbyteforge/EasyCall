# =============================================================================
# FILE: backend/apps/ai/views.py
# =============================================================================
# API views for AI workflow generation.
# Supports Anthropic, OpenAI, and Ollama (local) models.
# =============================================================================

import json
import logging
import httpx
from typing import Any

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

logger = logging.getLogger(__name__)

# =============================================================================
# NODE TYPE DEFINITIONS (for AI context)
# =============================================================================

NODE_TYPES_CONTEXT = """
Available node types for workflow generation:

## CONFIGURATION NODES
- credential_chainalysis: Configure Chainalysis API credentials. Outputs: credentials
- credential_trm: Configure TRM Labs API credentials. Outputs: credentials

## INPUT NODES
- single_address: Enter a single cryptocurrency address. Config: address, blockchain. Outputs: address, blockchain
- batch_input: Upload file with multiple addresses. Config: file, format, blockchain. Outputs: addresses, count, blockchain
- transaction_hash: Enter a transaction hash. Config: tx_hash, blockchain. Outputs: tx_hash, blockchain
- batch_transaction: Upload file with multiple transaction hashes. Outputs: tx_hashes, count, blockchain

## CHAINALYSIS QUERY NODES (require address input)
- chainalysis_cluster_info: Get cluster name, category, root address. Inputs: credentials (optional), address. Outputs: cluster_name, category, cluster_address, address
- chainalysis_cluster_balance: Get balance and transfer stats. Inputs: credentials (optional), address. Outputs: balance, total_sent, total_received, transfer_count, address
- chainalysis_cluster_counterparties: Get counterparty addresses. Inputs: credentials (optional), address. Outputs: counterparties, count, address
- chainalysis_transaction_details: Get transaction details. Inputs: credentials (optional), tx_hash. Outputs: transaction_details, tx_hash, inputs, outputs, fee, block_height
- chainalysis_exposure_category: Get risk category exposure. Inputs: credentials (optional), address. Outputs: direct_exposure, indirect_exposure, total_risk, high_risk_flags, address
- chainalysis_exposure_service: Get service exposure. Inputs: credentials (optional), address. Outputs: direct_exposure, indirect_exposure, service_count, address

## TRM LABS QUERY NODES (require address and blockchain inputs)
- trm_address_attribution: Get entities for address. Inputs: credentials (optional), address, blockchain. Outputs: entities, entity_count, address
- trm_total_exposure: Get total exposure analysis. Inputs: credentials (optional), address, blockchain. Outputs: exposures, total_volume, high_risk_entities, address
- trm_address_summary: Get address metrics. Inputs: credentials (optional), address, blockchain. Outputs: metrics, address
- trm_address_transfers: Get transfer list. Inputs: credentials (optional), address, blockchain. Outputs: transfers, transfer_count, total_volume_usd, address
- trm_network_intelligence: Get network/IP data. Inputs: credentials (optional), address. Outputs: ip_data, address

## OUTPUT NODES
- excel_export: Export to Excel. Inputs: data. Outputs: file_path. Config: sheet_name
- json_export: Export to JSON. Inputs: data. Outputs: file_path. Config: pretty_print
- csv_export: Export to CSV. Inputs: data. Outputs: file_path
- txt_export: Export to text. Inputs: data. Outputs: file_path
- pdf_export: Generate PDF report. Inputs: data. Outputs: file_path. Config: report_title, include_graphs
- console_log: Log to console. Inputs: data. Config: label, format
- output_path: Set output file path. Inputs: file_path_input. Config: output_path

## CONNECTION RULES
- Connections go from output pins to input pins
- address output connects to address input
- blockchain output connects to blockchain input
- credentials output connects to credentials input
- data outputs (any query result) connect to data input on export nodes
- file_path output connects to file_path_input on output_path node

## LAYOUT GUIDELINES
- Position nodes left-to-right: Input -> Query -> Output
- Space nodes ~300px apart horizontally
- Align related nodes vertically
- Start input nodes around x=100
- Query nodes around x=450
- Output nodes around x=800
"""

SYSTEM_PROMPT = f"""You are an expert workflow designer for EasyCall, a blockchain investigation platform.

Your job is to create workflow nodes and connections based on user requests.

{NODE_TYPES_CONTEXT}

When generating a workflow, respond with ONLY a JSON object (no markdown, no explanation before or after):

{{
    "message": "Brief description of what you created",
    "workflow": {{
        "nodes": [
            {{
                "id": "unique_id_1",
                "type": "node_type_here",
                "position": {{"x": 100, "y": 100}},
                "data": {{
                    "label": "Node Display Name",
                    "configValues": {{}}
                }}
            }}
        ],
        "edges": [
            {{
                "id": "edge_1",
                "source": "source_node_id",
                "target": "target_node_id",
                "sourceHandle": "output_pin_id",
                "targetHandle": "input_pin_id"
            }}
        ]
    }}
}}

Important rules:
1. Use ONLY the node types listed above
2. Always connect nodes properly (output -> input)
3. Position nodes logically left-to-right
4. Include all necessary nodes for a complete workflow
5. Generate unique IDs for nodes and edges
6. If adding to existing workflow, offset positions to avoid overlap
7. Return ONLY valid JSON, no markdown code blocks
"""


# =============================================================================
# AI PROVIDER HANDLERS
# =============================================================================

async def call_anthropic(
    prompt: str,
    api_key: str,
    model: str,
    conversation_history: list,
) -> dict[str, Any]:
    """Call Anthropic Claude API."""

    messages = []
    for msg in conversation_history:
        messages.append({
            "role": msg["role"],
            "content": msg["content"],
        })
    messages.append({
        "role": "user",
        "content": prompt,
    })

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": model,
                "max_tokens": 4096,
                "system": SYSTEM_PROMPT,
                "messages": messages,
            },
        )

        if response.status_code != 200:
            error_data = response.json()
            raise Exception(f"Anthropic API error: {error_data.get('error', {}).get('message', 'Unknown error')}")

        data = response.json()
        content = data["content"][0]["text"]
        return parse_ai_response(content)


async def call_openai(
    prompt: str,
    api_key: str,
    model: str,
    conversation_history: list,
) -> dict[str, Any]:
    """Call OpenAI API."""

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in conversation_history:
        messages.append({
            "role": msg["role"],
            "content": msg["content"],
        })
    messages.append({
        "role": "user",
        "content": prompt,
    })

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": messages,
                "max_tokens": 4096,
                "temperature": 0.7,
            },
        )

        if response.status_code != 200:
            error_data = response.json()
            raise Exception(f"OpenAI API error: {error_data.get('error', {}).get('message', 'Unknown error')}")

        data = response.json()
        content = data["choices"][0]["message"]["content"]
        return parse_ai_response(content)


async def call_ollama(
    prompt: str,
    endpoint: str,
    model: str,
    conversation_history: list,
) -> dict[str, Any]:
    """Call Ollama local API."""

    # Build conversation context
    context = SYSTEM_PROMPT + "\n\n"
    for msg in conversation_history:
        role = "User" if msg["role"] == "user" else "Assistant"
        context += f"{role}: {msg['content']}\n\n"
    context += f"User: {prompt}\n\nAssistant:"

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{endpoint}/api/generate",
            json={
                "model": model,
                "prompt": context,
                "stream": False,
            },
        )

        if response.status_code != 200:
            raise Exception(f"Ollama error: {response.text}")

        data = response.json()
        content = data.get("response", "")
        return parse_ai_response(content)


def parse_ai_response(content: str) -> dict[str, Any]:
    """Parse AI response and extract JSON workflow."""

    # Clean up response - remove markdown code blocks if present
    content = content.strip()
    if content.startswith("```json"):
        content = content[7:]
    elif content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
    content = content.strip()

    try:
        result = json.loads(content)

        # Validate structure
        if "workflow" not in result:
            result = {
                "message": "I've analyzed your request but couldn't generate a valid workflow. Please try rephrasing.",
                "workflow": None,
            }

        return result

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response as JSON: {e}")
        logger.error(f"Response content: {content[:500]}")

        # Try to extract JSON from response
        import re
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            try:
                result = json.loads(json_match.group())
                return result
            except json.JSONDecodeError:
                pass

        return {
            "message": content if content else "I couldn't generate a valid workflow. Please try again.",
            "workflow": None,
        }


# =============================================================================
# API VIEW
# =============================================================================

@csrf_exempt
@require_POST
def generate_workflow(request):
    """
    Generate workflow nodes and edges from natural language.

    POST /api/v1/ai/generate-workflow/

    Request body:
    {
        "prompt": "User's request",
        "provider": "anthropic" | "openai" | "ollama",
        "model": "model-id",
        "api_key": "API key for online providers",
        "offline_endpoint": "http://localhost:11434" (for Ollama),
        "conversation_history": [...],
        "existing_nodes": [...],
        "existing_edges": [...]
    }
    """
    import asyncio

    try:
        data = json.loads(request.body)

        prompt = data.get("prompt", "").strip()
        provider = data.get("provider", "anthropic")
        model = data.get("model", "claude-sonnet-4-20250514")
        api_key = data.get("api_key", "")
        offline_endpoint = data.get("offline_endpoint", "http://localhost:11434")
        conversation_history = data.get("conversation_history", [])
        existing_nodes = data.get("existing_nodes", [])
        existing_edges = data.get("existing_edges", [])

        if not prompt:
            return JsonResponse({"error": "Prompt is required"}, status=400)

        # Add context about existing workflow if present
        if existing_nodes:
            node_summary = ", ".join([f"{n.get('type', 'unknown')}" for n in existing_nodes[:10]])
            prompt = f"{prompt}\n\n[Context: The canvas already has these nodes: {node_summary}. Position new nodes to avoid overlap, starting at x=100 + (existing node count * 350).]"

        # Call appropriate provider
        if provider == "anthropic":
            if not api_key:
                return JsonResponse({"error": "API key required for Anthropic"}, status=400)
            result = asyncio.run(call_anthropic(prompt, api_key, model, conversation_history))

        elif provider == "openai":
            if not api_key:
                return JsonResponse({"error": "API key required for OpenAI"}, status=400)
            result = asyncio.run(call_openai(prompt, api_key, model, conversation_history))

        elif provider == "ollama":
            result = asyncio.run(call_ollama(prompt, offline_endpoint, model, conversation_history))

        else:
            return JsonResponse({"error": f"Unknown provider: {provider}"}, status=400)

        # Post-process workflow nodes to ensure proper structure
        if result.get("workflow") and result["workflow"].get("nodes"):
            for node in result["workflow"]["nodes"]:
                # Ensure data structure
                if "data" not in node:
                    node["data"] = {}
                if "configValues" not in node["data"]:
                    node["data"]["configValues"] = {}
                if "label" not in node["data"]:
                    node["data"]["label"] = node.get("type", "Unknown Node")

        return JsonResponse(result)

    except Exception as e:
        logger.exception("Error generating workflow")
        return JsonResponse({"error": str(e)}, status=500)
