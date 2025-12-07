"""
Workflow execution engine that runs nodes in order.
"""
import logging
from apps.workflows.models import Workflow
from apps.execution.models import ExecutionLog

logger = logging.getLogger(__name__)

class WorkflowExecutor:
    """
    Executes a workflow by running nodes in topological order.
    """
    
    def __init__(self, workflow: Workflow):
        self.workflow = workflow
        self.execution_context = {}  # Stores node outputs
    
    def execute(self) -> ExecutionLog:
        """
        Execute the workflow.
        
        Returns:
            ExecutionLog with results
        """
        # Create execution log
        execution = ExecutionLog.objects.create(
            workflow=self.workflow,
            status='PENDING'
        )
        
        try:
            execution.start()
            
            # Get workflow canvas data
            canvas_data = self.workflow.canvas_data
            nodes = canvas_data.get('nodes', [])
            edges = canvas_data.get('edges', [])
            
            # Determine execution order (topological sort)
            execution_order = self._topological_sort(nodes, edges)
            
            # Execute each node in order
            for node_data in execution_order:
                node_id = node_data['id']
                node_type = node_data['data']['type']
                
                logger.info(f"Executing node: {node_id} ({node_type})")
                
                # Get node instance
                node = self._create_node_instance(node_data)
                
                # Get input data from connected nodes
                input_data = self._get_node_inputs(node_id, edges)
                
                # EXECUTE NODE (this is where API call happens)
                result = node.execute(input_data)
                
                # Store result in context
                self.execution_context[node_id] = result
                
                logger.info(f"Node {node_id} completed: {result.get('status')}")
            
            # Mark execution as complete
            execution.complete(result_data=self.execution_context)
            
        except Exception as e:
            logger.error(f"Workflow execution failed: {e}")
            execution.fail(error_message=str(e))
        
        return execution
    
    def _create_node_instance(self, node_data: dict):
        """
        Create node instance based on type.
        
        This is where we import and instantiate the specific node class.
        """
        node_type = node_data['data']['type']
        
        # Import the right node class based on type
        if node_type == 'chainalysis_cluster_info':
            from apps.nodes.query_nodes_chainalysis.cluster_info_node import ClusterInfoNode
            return ClusterInfoNode(
                node_id=node_data['id'],
                configuration=node_data['data'].get('config', {})
            )
        
        # ... handle other node types
        
        raise ValueError(f"Unknown node type: {node_type}")
