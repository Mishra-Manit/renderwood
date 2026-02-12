import type { Node, Edge } from "@xyflow/react"

export interface WorkflowNodeData {
  label: string
  description: string
  icon?: string
  badge?: string
  modelName?: string
  outputPath?: string
}

export type WorkflowNode = Node<WorkflowNodeData>
export type WorkflowEdge = Edge
