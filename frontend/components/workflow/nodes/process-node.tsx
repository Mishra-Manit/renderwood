import { Handle, Position } from "@xyflow/react"
import type { WorkflowNodeData } from "../utils/workflow-types"

interface ProcessNodeProps {
  data: WorkflowNodeData
}

export function ProcessNode({ data }: ProcessNodeProps) {
  return (
    <div
      className="workflow-node"
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
        {data.badge && <div className="workflow-node-badge">{data.badge}</div>}
      </div>
      <Handle type="target" position={Position.Left} id="input" />
      <Handle type="source" position={Position.Right} id="output" />
    </div>
  )
}
