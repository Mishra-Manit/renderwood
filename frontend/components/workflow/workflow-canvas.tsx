"use client"

import { ReactFlow, Background, Controls } from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { StartNode } from "./nodes/start-node"
import { ProcessNode } from "./nodes/process-node"
import { AgentNode } from "./nodes/agent-node"
import { ModelNode } from "./nodes/model-node"
import { EndNode } from "./nodes/end-node"
import { workflowNodes, workflowEdges } from "./utils/workflow-data"

const nodeTypes = {
  start: StartNode,
  process: ProcessNode,
  agent: AgentNode,
  model: ModelNode,
  end: EndNode,
}

export function WorkflowCanvas() {
  return (
    <ReactFlow
      nodes={workflowNodes}
      edges={workflowEdges}
      nodeTypes={nodeTypes}
      fitView
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={true}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#999999" gap={20} size={2} />
      <Controls />
    </ReactFlow>
  )
}
