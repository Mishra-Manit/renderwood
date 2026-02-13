import { Handle, Position } from "@xyflow/react"
import type { WorkflowNodeData } from "../utils/workflow-types"

interface ModelNodeProps {
  data: WorkflowNodeData
}

export function ModelNode({ data }: ModelNodeProps) {
  return (
    <div
      className="workflow-node workflow-node-model"
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
        {data.modelName && (
          <div className="workflow-node-badge workflow-node-badge-yellow">
            {data.modelName}
          </div>
        )}
      </div>
      {data.showTopHandle && (
        <Handle type="target" position={Position.Top} id="input-top" />
      )}
      <Handle type="target" position={Position.Left} id="input-left" style={{ top: '50%' }} />
      <Handle type="source" position={Position.Bottom} id="output" />
    </div>
  )
}
