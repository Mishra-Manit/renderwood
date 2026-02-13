import type { Node, Edge } from "@xyflow/react"

export interface WorkflowNodeData extends Record<string, unknown> {
  label: string
  description: string
  icon?: string
  badge?: string
  modelName?: string
  outputPath?: string
  showTopHandle?: boolean
}

export type WorkflowNode = Node<WorkflowNodeData>
export type WorkflowEdge = Edge
