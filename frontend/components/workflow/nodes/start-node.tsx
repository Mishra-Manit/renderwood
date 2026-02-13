import { Handle, Position } from "@xyflow/react"
import type { WorkflowNodeData } from "../utils/workflow-types"

interface StartNodeProps {
  data: WorkflowNodeData
}

export function StartNode({ data }: StartNodeProps) {
  return (
    <div
      className="workflow-node workflow-node-start"
      role="article"
      aria-label={`${data.label}: ${data.description}`}
    >
      <div className="workflow-node-header">
        <span className="workflow-node-icon" aria-hidden="true">▶️</span>
        <span>{data.label}</span>
      </div>
      <div className="workflow-node-body">
        <div style={{ whiteSpace: 'pre-line' }}>
          {data.description}
        </div>
      </div>
      <Handle type="source" position={Position.Right} id="output" style={{ top: '50%' }} />
    </div>
  )
}
