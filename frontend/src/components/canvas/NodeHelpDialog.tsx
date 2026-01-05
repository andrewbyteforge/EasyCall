// =============================================================================
// FILE: frontend/src/components/canvas/NodeHelpDialog.tsx
// =============================================================================
// Dialog component that shows beginner-friendly help when a node is dropped
// onto the canvas in Easy Mode. Provides simple explanations and suggestions.
// =============================================================================

import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Chip,
    Divider,
} from '@mui/material';
import { NodeTypeDefinition, NodeCategory } from '../../types/node_types';

// =============================================================================
// BEGINNER-FRIENDLY EXPLANATIONS
// =============================================================================

interface NodeHelpContent {
    simpleExplanation: string;
    whatItDoes: string;
    connectTo: string[];
    tips: string[];
    example?: string;
}

/**
 * Get beginner-friendly help content for each node type.
 * Written in simple, non-technical language.
 */
function getNodeHelpContent(nodeType: string): NodeHelpContent {
    const helpContent: Record<string, NodeHelpContent> = {
        // Configuration Nodes
        credential_chainalysis: {
            simpleExplanation: "This is like a key that unlocks Chainalysis services. You need it to look up blockchain information.",
            whatItDoes: "Stores your Chainalysis API key so the system can make requests on your behalf.",
            connectTo: [
                "Any Chainalysis query node (ones with 'Chainalysis' in the name)",
                "Connect the 'credentials' output to any Chainalysis node's 'credentials' input"
            ],
            tips: [
                "You only need ONE of these per workflow",
                "If you don't add this node, the system will use your default API key",
                "Keep your API key secret - don't share workflows with keys in them"
            ],
            example: "Add this first if you have multiple API keys or want to use a test environment."
        },
        credential_trm: {
            simpleExplanation: "This is like a key that unlocks TRM Labs services. You need it to look up blockchain information.",
            whatItDoes: "Stores your TRM Labs API key so the system can make requests on your behalf.",
            connectTo: [
                "Any TRM Labs query node (ones with 'TRM' in the name)",
                "Connect the 'credentials' output to any TRM node's 'credentials' input"
            ],
            tips: [
                "You only need ONE of these per workflow",
                "If you don't add this node, the system will use your default API key",
                "Keep your API key secret - don't share workflows with keys in them"
            ],
            example: "Add this first if you have multiple API keys or want to use a test environment."
        },

        // Input Nodes
        single_address: {
            simpleExplanation: "This is where you type in a cryptocurrency address you want to investigate.",
            whatItDoes: "Takes a wallet address (like a Bitcoin or Ethereum address) and passes it to other nodes for analysis.",
            connectTo: [
                "Query nodes like 'Cluster Info', 'Address Attribution', or 'Exposure by Category'",
                "Connect the 'address' output to the query node's 'address' input"
            ],
            tips: [
                "Make sure to select the correct blockchain (Bitcoin, Ethereum, etc.)",
                "The address format varies by blockchain - Bitcoin addresses start with 1, 3, or bc1",
                "Ethereum addresses always start with 0x"
            ],
            example: "Paste a Bitcoin address like: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        },
        batch_input: {
            simpleExplanation: "Upload a file with many addresses to investigate all at once.",
            whatItDoes: "Reads addresses from a file (CSV, Excel, etc.) and processes them together, saving you time.",
            connectTo: [
                "Query nodes that can handle multiple addresses",
                "Export nodes to save the results"
            ],
            tips: [
                "Put each address on its own row in the file",
                "CSV files work best - you can save Excel as CSV",
                "Make sure all addresses are from the same blockchain"
            ],
            example: "Upload a CSV file with 100 Bitcoin addresses to check them all for risk."
        },
        transaction_hash: {
            simpleExplanation: "Enter a transaction ID to get details about a specific blockchain transaction.",
            whatItDoes: "Takes a transaction hash (the unique ID of a blockchain transaction) for analysis.",
            connectTo: [
                "Transaction Details (Chainalysis) node",
                "Export nodes to save the results"
            ],
            tips: [
                "A transaction hash is a long string of letters and numbers",
                "You can find transaction hashes on blockchain explorers",
                "Make sure the hash matches the selected blockchain"
            ],
            example: "Investigate a suspicious Bitcoin transaction by pasting its hash."
        },
        batch_transaction: {
            simpleExplanation: "Upload a file with many transaction IDs to investigate all at once.",
            whatItDoes: "Reads transaction hashes from a file and processes them together.",
            connectTo: [
                "Transaction query nodes",
                "Export nodes to save the results"
            ],
            tips: [
                "Put each transaction hash on its own row",
                "Useful for investigating a series of related transactions",
                "All transactions should be from the same blockchain"
            ],
            example: "Upload a list of transaction hashes from a case investigation."
        },

        // Chainalysis Query Nodes
        chainalysis_cluster_info: {
            simpleExplanation: "Find out who owns a wallet address - is it an exchange, a darknet market, or unknown?",
            whatItDoes: "Looks up the address in Chainalysis's database to identify the entity it belongs to.",
            connectTo: [
                "Connect an Address Input node to the 'address' input",
                "Optionally connect a Chainalysis Credentials node",
                "Connect outputs to Export nodes or Console Log"
            ],
            tips: [
                "The 'category' tells you what type of entity (exchange, mixer, etc.)",
                "Not all addresses have known owners - some will show as 'Unknown'",
                "The cluster groups related addresses together"
            ],
            example: "Check if a Bitcoin address belongs to a known exchange like Coinbase."
        },
        chainalysis_cluster_balance: {
            simpleExplanation: "See how much crypto a wallet cluster has and its transaction history.",
            whatItDoes: "Gets the current balance and total amounts sent/received for all addresses in a cluster.",
            connectTo: [
                "Connect an Address Input node to the 'address' input",
                "Connect outputs to Export nodes for reports"
            ],
            tips: [
                "Balance is the current amount held",
                "Total sent/received shows historical activity",
                "You can view values in crypto or USD"
            ],
            example: "Check if an address has significant funds or transaction volume."
        },
        chainalysis_cluster_counterparties: {
            simpleExplanation: "See who has sent money to or received money from this wallet.",
            whatItDoes: "Lists all the other wallets that have transacted with the target address.",
            connectTo: [
                "Connect an Address Input node to the 'address' input",
                "Connect counterparties output to further analysis"
            ],
            tips: [
                "Choose 'Sent' to see who received money FROM this address",
                "Choose 'Received' to see who sent money TO this address",
                "This is great for tracing money flow"
            ],
            example: "Find out which exchanges a suspicious wallet has sent funds to."
        },
        chainalysis_transaction_details: {
            simpleExplanation: "Get all the details about a specific transaction - who sent, who received, how much.",
            whatItDoes: "Retrieves comprehensive information about a blockchain transaction.",
            connectTo: [
                "Connect a Transaction Hash Input node to the 'tx_hash' input",
                "Connect outputs to Export nodes for reports"
            ],
            tips: [
                "Shows all inputs (senders) and outputs (receivers)",
                "Includes the transaction fee paid",
                "Shows which block contains the transaction"
            ],
            example: "Analyze a suspicious transaction to see all parties involved."
        },
        chainalysis_exposure_category: {
            simpleExplanation: "Check if a wallet has connections to risky activities like darknet markets or ransomware.",
            whatItDoes: "Analyzes an address for exposure to different risk categories (gambling, darknet, sanctions, etc.).",
            connectTo: [
                "Connect an Address Input node to the 'address' input",
                "Connect risk data to Export nodes for compliance reports"
            ],
            tips: [
                "Direct exposure means the address interacted directly with risky entities",
                "Indirect exposure means there's a connection through intermediaries",
                "This is essential for compliance and risk assessment"
            ],
            example: "Check if a customer's wallet has any darknet market exposure before onboarding."
        },
        chainalysis_exposure_service: {
            simpleExplanation: "See which specific services and businesses a wallet has interacted with.",
            whatItDoes: "Lists exposure to known services like exchanges, payment processors, and other entities.",
            connectTo: [
                "Connect an Address Input node to the 'address' input",
                "Use for detailed service-level analysis"
            ],
            tips: [
                "More detailed than category exposure",
                "Shows specific exchange names and services",
                "Useful for understanding the address's usage patterns"
            ],
            example: "See which exchanges a wallet has used historically."
        },

        // TRM Labs Query Nodes
        trm_address_attribution: {
            simpleExplanation: "Find out who owns a wallet address using TRM Labs' database.",
            whatItDoes: "Looks up the address to identify known entities and their information.",
            connectTo: [
                "Connect an Address Input node to the 'address' input",
                "The blockchain input is automatically connected from the address node"
            ],
            tips: [
                "TRM may have different attributions than Chainalysis",
                "Use both services for more complete coverage",
                "Entity information includes names and categories"
            ],
            example: "Cross-reference an address attribution with TRM Labs."
        },
        trm_total_exposure: {
            simpleExplanation: "Get a complete risk picture showing all entities a wallet has interacted with.",
            whatItDoes: "Provides comprehensive exposure analysis including volume and risk indicators.",
            connectTo: [
                "Connect an Address Input node to the 'address' input",
                "Great for risk assessment reports"
            ],
            tips: [
                "Shows total volume exposed to different entities",
                "Highlights high-risk entities separately",
                "Use for compliance and due diligence"
            ],
            example: "Generate a complete risk exposure report for a customer wallet."
        },
        trm_address_summary: {
            simpleExplanation: "Get a quick overview of everything about an address in one place.",
            whatItDoes: "Returns a summary of address metrics and key information.",
            connectTo: [
                "Connect an Address Input node to the 'address' input",
                "Good starting point for investigations"
            ],
            tips: [
                "Gives you the big picture quickly",
                "Use this to decide what to investigate further",
                "Includes key metrics and flags"
            ],
            example: "Get a quick summary before doing a deep dive investigation."
        },
        trm_address_transfers: {
            simpleExplanation: "See all the transactions an address has made - money in and money out.",
            whatItDoes: "Lists all transfers associated with an address with details and volumes.",
            connectTo: [
                "Connect an Address Input node to the 'address' input",
                "Export to spreadsheet for detailed analysis"
            ],
            tips: [
                "Can filter by direction (incoming, outgoing, or both)",
                "Includes USD values for transactions",
                "Limited to a set number of results - adjust Max Results if needed"
            ],
            example: "Export all transactions for a wallet to analyze in Excel."
        },
        trm_network_intelligence: {
            simpleExplanation: "Get advanced intelligence like IP addresses associated with a wallet.",
            whatItDoes: "Returns network-level data including IP associations and other intelligence.",
            connectTo: [
                "Connect an Address Input node to the 'address' input",
                "Advanced investigation feature"
            ],
            tips: [
                "This provides more technical intelligence data",
                "Not all addresses will have network data available",
                "Useful for advanced investigations"
            ],
            example: "Try to find IP information linked to a suspicious wallet."
        },

        // Output Nodes
        output_path: {
            simpleExplanation: "Choose where to save your exported file on your computer.",
            whatItDoes: "Specifies the folder and filename for your exported data.",
            connectTo: [
                "Connect any export node's 'file_path' output to this node's input",
                "Required to actually save files to your computer"
            ],
            tips: [
                "Click the path field to open a file picker",
                "You MUST add this node to save exports to your computer",
                "The file extension is determined by the export type"
            ],
            example: "Connect a CSV Export to this, then click to choose Desktop/results.csv"
        },
        txt_export: {
            simpleExplanation: "Save your results as a simple text file.",
            whatItDoes: "Converts the connected data into plain text format.",
            connectTo: [
                "Connect query results to the 'data' input",
                "Connect the 'file_path' output to an Output Path node"
            ],
            tips: [
                "Simple format that opens in any text editor",
                "Remember to add an Output Path node to save the file"
            ],
            example: "Export a list of addresses to a text file."
        },
        excel_export: {
            simpleExplanation: "Save your results as an Excel spreadsheet for easy viewing and analysis.",
            whatItDoes: "Creates a formatted Excel file with your data in columns and rows.",
            connectTo: [
                "Connect query results to the 'data' input",
                "Connect the 'file_path' output to an Output Path node"
            ],
            tips: [
                "Great for sharing with colleagues",
                "Data is automatically formatted into columns",
                "You can customize the sheet name"
            ],
            example: "Export investigation results to share with your team."
        },
        json_export: {
            simpleExplanation: "Save your results in JSON format - useful for developers and other systems.",
            whatItDoes: "Exports data in JSON format, which preserves all the structure.",
            connectTo: [
                "Connect query results to the 'data' input",
                "Connect the 'file_path' output to an Output Path node"
            ],
            tips: [
                "JSON keeps all the data structure intact",
                "Can be imported into other tools and databases",
                "Use Pretty Print for human-readable format"
            ],
            example: "Export data to import into another analysis tool."
        },
        csv_export: {
            simpleExplanation: "Save your results as a CSV file - works with Excel and most data tools.",
            whatItDoes: "Creates a comma-separated file that opens in spreadsheets and databases.",
            connectTo: [
                "Connect query results to the 'data' input",
                "Connect the 'file_path' output to an Output Path node"
            ],
            tips: [
                "The most universal file format",
                "Opens in Excel, Google Sheets, and databases",
                "Good for importing into other systems"
            ],
            example: "Export address list to import into another system."
        },
        pdf_export: {
            simpleExplanation: "Create a professional PDF report with your results - perfect for sharing.",
            whatItDoes: "Generates a formatted PDF document with your data, charts, and branding.",
            connectTo: [
                "Connect query results to the 'data' input",
                "Connect the 'file_path' output to an Output Path node"
            ],
            tips: [
                "Creates professional-looking reports",
                "Can include charts and visualizations",
                "Great for compliance and audit documentation"
            ],
            example: "Generate a professional risk assessment report for a client."
        },
        console_log: {
            simpleExplanation: "Show your results in the output panel at the bottom - great for testing.",
            whatItDoes: "Displays the connected data in the output panel so you can see the results.",
            connectTo: [
                "Connect any data output to see what it contains",
                "No Output Path needed - shows directly in the panel"
            ],
            tips: [
                "Perfect for debugging and testing your workflow",
                "See exactly what data is flowing through",
                "Add a label to identify different outputs"
            ],
            example: "Add this to see what a query returns before exporting."
        },
    };

    return helpContent[nodeType] || {
        simpleExplanation: "This node performs an operation in your workflow.",
        whatItDoes: "Processes data and passes it to connected nodes.",
        connectTo: ["Connect to other nodes based on input/output compatibility"],
        tips: ["Check the node's inputs and outputs in the sidebar for details"],
    };
}

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface NodeHelpDialogProps {
    open: boolean;
    onClose: () => void;
    node: NodeTypeDefinition | null;
    onDontShowAgain?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

const NodeHelpDialog: React.FC<NodeHelpDialogProps> = ({
    open,
    onClose,
    node,
    onDontShowAgain,
}) => {
    if (!node) return null;

    const helpContent = getNodeHelpContent(node.type);

    // Get category label for display
    const getCategoryLabel = (category: NodeCategory): string => {
        switch (category) {
            case NodeCategory.CONFIGURATION:
                return 'Setup';
            case NodeCategory.INPUT:
                return 'Input';
            case NodeCategory.QUERY:
                return 'Analysis';
            case NodeCategory.OUTPUT:
                return 'Export';
            default:
                return 'Node';
        }
    };

    // Get category color
    const getCategoryColor = (category: NodeCategory): string => {
        switch (category) {
            case NodeCategory.CONFIGURATION:
                return '#f093fb';
            case NodeCategory.INPUT:
                return '#4facfe';
            case NodeCategory.QUERY:
                return '#667eea';
            case NodeCategory.OUTPUT:
                return '#00f2fe';
            default:
                return '#667eea';
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    backgroundColor: 'rgba(5, 10, 30, 0.98)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(102, 126, 234, 0.3)',
                    borderRadius: '16px',
                    color: '#ffffff',
                },
            }}
        >
            {/* Header */}
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    pb: 2,
                }}
            >
                <Box
                    sx={{
                        fontSize: '2rem',
                        width: 50,
                        height: 50,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: `${getCategoryColor(node.category)}20`,
                        borderRadius: '12px',
                        border: `1px solid ${getCategoryColor(node.category)}40`,
                    }}
                >
                    {node.icon}
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
                        {node.name}
                    </Typography>
                    <Chip
                        label={getCategoryLabel(node.category)}
                        size="small"
                        sx={{
                            mt: 0.5,
                            height: 22,
                            fontSize: '0.7rem',
                            backgroundColor: `${getCategoryColor(node.category)}30`,
                            color: getCategoryColor(node.category),
                            border: `1px solid ${getCategoryColor(node.category)}50`,
                        }}
                    />
                </Box>
                <Chip
                    label="Easy Mode"
                    size="small"
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#ffffff',
                        fontWeight: 600,
                    }}
                />
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
                {/* Simple Explanation */}
                <Box sx={{ mb: 3 }}>
                    <Typography
                        variant="subtitle2"
                        sx={{
                            color: '#4facfe',
                            fontWeight: 600,
                            mb: 1,
                            fontSize: '0.85rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}
                    >
                        💡 What is this?
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: '1rem',
                            lineHeight: 1.6,
                            color: '#ffffff',
                            backgroundColor: 'rgba(79, 172, 254, 0.1)',
                            padding: 2,
                            borderRadius: '10px',
                            border: '1px solid rgba(79, 172, 254, 0.2)',
                        }}
                    >
                        {helpContent.simpleExplanation}
                    </Typography>
                </Box>

                {/* What It Does */}
                <Box sx={{ mb: 3 }}>
                    <Typography
                        variant="subtitle2"
                        sx={{
                            color: '#f093fb',
                            fontWeight: 600,
                            mb: 1,
                            fontSize: '0.85rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}
                    >
                        ⚙️ What it does
                    </Typography>
                    <Typography sx={{ color: '#a0aec0', fontSize: '0.9rem', lineHeight: 1.6 }}>
                        {helpContent.whatItDoes}
                    </Typography>
                </Box>

                <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.08)' }} />

                {/* What to Connect */}
                <Box sx={{ mb: 3 }}>
                    <Typography
                        variant="subtitle2"
                        sx={{
                            color: '#00f2fe',
                            fontWeight: 600,
                            mb: 1.5,
                            fontSize: '0.85rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}
                    >
                        🔗 What to connect
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                        {helpContent.connectTo.map((item, index) => (
                            <Typography
                                component="li"
                                key={index}
                                sx={{
                                    color: '#a0aec0',
                                    fontSize: '0.9rem',
                                    mb: 0.5,
                                    lineHeight: 1.5,
                                }}
                            >
                                {item}
                            </Typography>
                        ))}
                    </Box>
                </Box>

                {/* Tips */}
                <Box sx={{ mb: 2 }}>
                    <Typography
                        variant="subtitle2"
                        sx={{
                            color: '#667eea',
                            fontWeight: 600,
                            mb: 1.5,
                            fontSize: '0.85rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}
                    >
                        ✨ Tips
                    </Typography>
                    <Box
                        sx={{
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            borderRadius: '10px',
                            border: '1px solid rgba(102, 126, 234, 0.2)',
                            p: 2,
                        }}
                    >
                        {helpContent.tips.map((tip, index) => (
                            <Typography
                                key={index}
                                sx={{
                                    color: '#a0aec0',
                                    fontSize: '0.85rem',
                                    mb: index < helpContent.tips.length - 1 ? 1 : 0,
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 1,
                                }}
                            >
                                <span style={{ color: '#667eea' }}>•</span>
                                {tip}
                            </Typography>
                        ))}
                    </Box>
                </Box>

                {/* Example */}
                {helpContent.example && (
                    <Box
                        sx={{
                            backgroundColor: 'rgba(240, 147, 251, 0.1)',
                            borderRadius: '10px',
                            border: '1px solid rgba(240, 147, 251, 0.2)',
                            p: 2,
                        }}
                    >
                        <Typography
                            sx={{
                                color: '#f093fb',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                mb: 0.5,
                            }}
                        >
                            📝 Example:
                        </Typography>
                        <Typography sx={{ color: '#a0aec0', fontSize: '0.85rem' }}>
                            {helpContent.example}
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions
                sx={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    p: 2,
                    gap: 1,
                }}
            >
                {onDontShowAgain && (
                    <Button
                        onClick={onDontShowAgain}
                        sx={{
                            color: '#a0aec0',
                            fontSize: '0.8rem',
                            textTransform: 'none',
                            '&:hover': {
                                color: '#ffffff',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            },
                        }}
                    >
                        Switch to Advanced Mode
                    </Button>
                )}
                <Box sx={{ flex: 1 }} />
                <Button
                    onClick={onClose}
                    variant="contained"
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#ffffff',
                        fontWeight: 600,
                        px: 3,
                        borderRadius: '8px',
                        textTransform: 'none',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)',
                        },
                    }}
                >
                    Got it!
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default NodeHelpDialog;
