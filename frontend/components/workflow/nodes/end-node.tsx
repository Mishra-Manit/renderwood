import { Handle, Position } from "@xyflow/react"
import type { WorkflowNodeData } from "../utils/workflow-types"

interface EndNodeProps {
  data: WorkflowNodeData
}

export function EndNode({ data }: EndNodeProps) {
  return (
    <div
      className="workflow-node workflow-node-end"
      role="article"
      aria-label={`${data.label}: ${data.description}`}
    >
      <div className="workflow-node-header">
        <span className="workflow-node-icon" aria-hidden="true">🎬</span>
        <span>{data.label}</span>
      </div>
      <div className="workflow-node-body">
        <div style={{ whiteSpace: 'pre-line' }}>
          {data.description}
        </div>
        {data.outputPath && (
          <div className="workflow-node-path">{data.outputPath}</div>
        )}
      </div>
      <Handle type="target" position={Position.Left} id="input" />
    </div>
  )
}
