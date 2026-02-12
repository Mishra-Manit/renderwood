import type { WorkflowNode, WorkflowEdge } from "./workflow-types"

export const workflowNodes: WorkflowNode[] = [
  // Row 1 (Left to Right): 4 nodes
  {
    id: "apiEntry",
    type: "start",
    position: { x: 50, y: 50 },
    data: {
      label: "API Request",
      description: "POST request to\n/api/videos/create\nendpoint",
    },
  },
  {
    id: "jobSetup",
    type: "process",
    position: { x: 270, y: 50 },
    data: {
      label: "Setup Job Dir",
      description: "Copy remotion_project\ntemplate to isolated\njob directory",
    },
  },
  {
    id: "assetCopy",
    type: "process",
    position: { x: 490, y: 50 },
    data: {
      label: "Copy Assets",
      description: "Move uploaded files\nto job /public folder\nfor video access",
    },
  },
  {
    id: "promptEnhancement",
    type: "model",
    position: { x: 710, y: 50 },
    data: {
      label: "Enhance Prompt",
      description: "Fireworks AI enhances\nprompt with style\nguidance and details",
      modelName: "Kimi K2.5",
    },
  },

  // Row 2 (Right to Left): 4 nodes
  {
    id: "agentPlanning",
    type: "agent",
    position: { x: 710, y: 230 },
    data: {
      label: "Plan Video",
      description: "Analyze requirements\nand plan implementation\nsteps",
    },
  },
  {
    id: "agentEditing",
    type: "agent",
    position: { x: 490, y: 230 },
    data: {
      label: "Edit Components",
      description: "Modify React and\nRemotion components\nfor video",
    },
  },
  {
    id: "agentRender",
    type: "agent",
    position: { x: 270, y: 230 },
    data: {
      label: "Render Video",
      description: "Execute remotion\nrender to generate\nMP4 output",
      badge: "Multi-turn",
    },
  },
  {
    id: "response",
    type: "end",
    position: { x: 50, y: 230 },
    data: {
      label: "Return Response",
      description: "Send VideoCreateResponse\nwith job_id and\nvideo path to client",
      outputPath: "/api/videos/{job_id}.mp4",
    },
  },
]

export const workflowEdges: WorkflowEdge[] = [
  // Row 1 (Left to Right): API → Setup → Assets → Prompt
  { id: "e1", source: "apiEntry", target: "jobSetup", type: "smoothstep" },
  { id: "e2", source: "jobSetup", target: "assetCopy", type: "smoothstep" },
  { id: "e3", source: "assetCopy", target: "promptEnhancement", type: "smoothstep", sourceHandle: "output", targetHandle: "input-left" },
  
  // Transition from Row 1 to Row 2: Prompt → Plan
  { id: "e4", source: "promptEnhancement", target: "agentPlanning", type: "smoothstep" },
  
  // Row 2 (Right to Left): Plan → Edit → Render → Response
  { id: "e5", source: "agentPlanning", target: "agentEditing", type: "smoothstep" },
  { id: "e6", source: "agentEditing", target: "agentRender", type: "smoothstep" },
  { id: "e7", source: "agentRender", target: "response", type: "smoothstep" },
]
