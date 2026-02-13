import { Handle, Position } from "@xyflow/react"
import type { WorkflowNodeData } from "../utils/workflow-types"

interface AgentNodeProps {
  data: WorkflowNodeData
}

export function AgentNode({ data }: AgentNodeProps) {
  return (
    <div
      className="workflow-node workflow-node-agent"
      role="article"
      aria-label={`${data.label}: ${data.description}`}
    >
      <div className="workflow-node-header">
        {data.icon && <span className="workflow-node-icon" aria-hidden="true">{data.icon}</span>}
        <span>{data.label}</span>
      </div>
      <div className="workflow-node-body">
        <div style={{ whiteSpace: 'pre-line' }}>
          {data.description}
        </div>
        {data.badge && (
          <div className="workflow-node-badge workflow-node-badge-purple">
            {data.badge}
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Right} id="input" style={{ top: '50%' }} />
      <Handle type="source" position={Position.Left} id="output" style={{ top: '50%' }} />
      {data.showTopHandle && (
        <Handle type="target" position={Position.Top} id="input-top" />
      )}
    </div>
  )
}
