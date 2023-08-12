import React, {useState, useRef, useCallback, useMemo, useContext, memo, forwardRef, useImperativeHandle} from 'react';
import ReactFlow, {ReactFlowProvider, addEdge, useNodesState, useEdgesState, Controls, Background, useStoreApi} from 'reactflow';
import type {Edge, Connection} from 'reactflow';
import {isCardAlreadyLinked, isCardAlreadyPresent, isCardGettingLinkedToCorrectCard, isDTMFGotRepeated} from "./validations";
import 'reactflow/dist/style.css';
import Snackbar from "../../../../../../_metronic/helpers/components/utilities/Snackbar";
import type {CustomSnackBar} from "../../../../../setup/types/components";
import ShowSnackbar from '../../../../../../_metronic/helpers/components/utilities/ShowSnackbar'
import { deeplyCopyJsObject, getBasicSnackBarInfo, log } from '../../../../../setup/funcs/helpers'
import {flowContext} from "../Index";
import Dialog from "./dialogs/Index";
import ExperienceNode from "./nodes/Experience";
import CategoryNode from "./nodes/Category";
import StartNode from "./nodes/Start";
import "./index.css";

export interface Node {
    id: string,
    type: string,
    data: {
        label: string,
        module: string|null,
        id: number|null,
        dtmf: number|null,
        parentId: number|null
    };
    position: {
        x: number,
        y: number
    };
}

export interface NodeDialog {
    id: string,
    type: string,
    module: string|null,
    module_id: number|null,
    module_parent_id: number|null,
    open: boolean,
    isSubmitted: boolean,
    data: Record<string, any>
}

export const getType = (module?: string) => {
    let type = 'experience';
    switch (module) {
        case 'Experience':
            type = 'experience';
            break;
        case 'Category':
            type = 'category';
            break;
        default:
            type = 'start'
            break;
    }
    return type;
}

const initialNodes: Node[] = [
    {
        id: 'node_0',
        type: 'start',
        data: { label: 'Start', module: null, id: null, dtmf: null, parentId: null },
        position: { x: 0, y: 0 },
    },
];

const initialNodeDialogs: NodeDialog[] = [
    {
        id: initialNodes[0].id,
        type: initialNodes[0].type,
        module: null,
        module_id: null,
        module_parent_id: null,
        open: false,
        isSubmitted: false,
        data: {
            name: "Start"
        }
    }
];

const getId = (nodes: Record<string, any>[]) => {
    let latestNumber: number;
    if (nodes.length) {
        const nodeID = nodes[nodes.length-1].id;
        const nodeIDSplit = nodeID.split('_')[1];
        latestNumber = Number(nodeIDSplit) + 1;
    } else {
        latestNumber = 0;
    }
    return `node_${latestNumber}`;
};
const getModuleAndLabel = (reactflow: string) => {
    const reactflowStringSplitted = reactflow.split('/');
    return [...reactflowStringSplitted];
};

const Flow = forwardRef((props: any, ref) => {

    const {flowData, setExperiences} = useContext(flowContext);

    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(flowData.nodes || deeplyCopyJsObject(initialNodes));
    const [edges, setEdges, onEdgesChange] = useEdgesState(flowData.edges || []);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const [nodesDialog, setNodesDialog] = useState<NodeDialog[]>(flowData.nodeDialogs || deeplyCopyJsObject(initialNodeDialogs));

    const [snackbarInfo, setSnackbarInfo] = useState<CustomSnackBar>(getBasicSnackBarInfo());

    const nodeTypes: Record<string, any> = useMemo(() => ({ experience: ExperienceNode, category: CategoryNode, start: StartNode }), []);
    
    const onConnect = useCallback((params: Edge<any> | Connection) => {
        const source = params.source;
        const target = params.target;

        try {
            isCardAlreadyLinked(params, edges);
            isCardGettingLinkedToCorrectCard(params, nodes);

            setEdges((eds) => addEdge({ ...params, animated: false }, eds));
        } catch (error) {
            setSnackbarInfo({key: Math.random(), message: (error as Error).message, success: false});
        }

    }, [edges, nodes]);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();

        const reactFlowBounds = reactFlowWrapper.current!.getBoundingClientRect();
        const reactflow = event.dataTransfer.getData('application/reactflow');

        // check if the dropped element is valid
        if (typeof reactflow === 'undefined' || !reactflow) {
            return;
        }

        const [module, label, id, parentId] = getModuleAndLabel(reactflow);
        const type = getType(module);
        const parentIdWithPerfectType = parentId ? Number(parentId) : null;
        
        const position = reactFlowInstance.project({
            x: event.clientX - reactFlowBounds.left,
            y: event.clientY - reactFlowBounds.top,
        });
        const newNode: Node = {
            id: getId(nodes),
            type,
            position,
            data: { label, module, id: Number(id), dtmf: null, parentId: parentIdWithPerfectType },
        };

        try {

            isCardAlreadyPresent(newNode, nodes);
            
            setNodes((nds) => nds.concat(newNode));
            addIntoNodeDialogs(newNode);
        } catch (error) {
            setSnackbarInfo({key: Math.random(), message: (error as Error).message, success: false});
        }

    }, [reactFlowInstance, nodes]);
    const addIntoNodeDialogs = useCallback((newNode: any) => {
        const dialogInfo = {
            id: newNode.id,
            type: newNode.type,
            module: newNode.data.module,
            module_id: newNode.data.id,
            module_parent_id: newNode.data.parentId,
            open: false,
            isSubmitted: false,
            data: {
                name: newNode.data.label
            }
        };
        setNodesDialog(nodesDialog => [...nodesDialog, dialogInfo]);
    }, [])

    const onNodeClick = useCallback((_: any, node: any) => {
        const classes = (_.target as HTMLDivElement).getAttribute('class')!;
        const isClickedOnRemoveIcon = /remove-node/.test(classes);
        if (isClickedOnRemoveIcon) {
            removeNode(node);
            return;
        }
        setOpenDialog(node, true);
    }, []);
    const removeNode = useCallback((node: any) => {
        const id = node.id;
        
        setNodes(nodes => nodes.filter(node => node.id != id));
        setEdges(edges => edges.filter(edge => edge.source != id && edge.target != id));
        removeFromNodeDialogs(node);
    }, []);
    const removeFromNodeDialogs = useCallback((node: any) => {
        setNodesDialog((allNodeDialogs: NodeDialog[]) => {
            const nodesDialogWithOneRemoved = allNodeDialogs.filter(nodeDialog => nodeDialog.id !== node.id);   
            return nodesDialogWithOneRemoved;
        });
    }, [])
    const setOpenDialog = useCallback((node: any, openState: boolean) => {
        setNodesDialog((allNodeDialogs: NodeDialog[]) => {
            const nodesDialogWithOneOpen = allNodeDialogs.map(nodeDialog => {
                if (nodeDialog.id === node.id) {
                    nodeDialog.open = openState;
                }
                return nodeDialog;
            });   
            return nodesDialogWithOneOpen;
        });
    }, [])

    const onEdgeClick = useCallback((_: any, node: any) => {
        removeEdge(node);
    }, []);
    const removeEdge = useCallback((node: any) => {
        const id = node.id;
        setEdges(edges => edges.filter(edge => edge.id != id));
    }, []);

    const checkifDTMFGotRepeated = useCallback((nodeDialog: any, data: Record<string, any>) => {
        let DTMFGotRepeated = false;
        try {
            const selectedNodeDialog = nodeDialog;

            isDTMFGotRepeated(selectedNodeDialog, nodesDialog, data);
        } catch (error) {
            setSnackbarInfo({key: Math.random(), message: (error as Error).message, success: false});
            DTMFGotRepeated = true;
        }
        return DTMFGotRepeated;
    }, [nodes])

    const saveNodeData = useCallback((nodeDialog: any, data: Record<string, any>) => {
        try {
            const selectedNodeDialog = nodeDialog;

            isDTMFGotRepeated(selectedNodeDialog, nodesDialog, data);

            setNodesDialog((allNodeDialogs: NodeDialog[]) => {
                const nodesDialogWithOneOpen = allNodeDialogs.map(nodeDialog => {
                    if (nodeDialog.id === selectedNodeDialog.id) {
                        nodeDialog.data = data;
                        nodeDialog.isSubmitted = true;
                    } else if (nodeDialog.module === selectedNodeDialog.module && nodeDialog.module_id === selectedNodeDialog.module_id) {
                        nodeDialog.data.name = data.name;
                    }
                    return nodeDialog;
                });   
                return nodesDialogWithOneOpen;
            });

            setNodes(allNodes => {
                const nodesWithOneUpdatedLabel = allNodes.map(node => {
                    if (node.id === selectedNodeDialog.id) {
                        node.data.label = data.name;
                        node.data.dtmf = data.dtmf_digit;
                        node.position.x = node.position.x + 1;
                    } else if (node.data.module === selectedNodeDialog.module && node.data.id === selectedNodeDialog.module_id) {
                        node.data.label = data.name;
                        node.position.x = node.position.x + 1;
                    }
                    return node;
                });   
                return nodesWithOneUpdatedLabel;
            });
            
            const selectedNode = nodes.filter(node => node.id === selectedNodeDialog.id)[0];
            setExperiences((experiences: Record<string, any>[]) => {
                if (selectedNode) {
                    if (selectedNode.data.module === "Experience") {
                        const experiencesWithOneUpdatedLabel = experiences.map(experience => {
                            if (experience.id === selectedNode.data.id) {
                                experience.name = data.name;
                            }
                            return experience;
                        });       
                        return experiencesWithOneUpdatedLabel;
                    } else if (selectedNode.data.module === "Category") {
                        const experiencesWithOneUpdatedCategoryLabel = experiences.map(experience => {
                            const categories = experience.categories.map((category: Record<string, any>) => {
                                if (category.id === selectedNode.data.id) {
                                    category.name = data.name;
                                }
                                return category;
                            });
                            experience.categories = categories;
                            return experience;
                        });
                        return experiencesWithOneUpdatedCategoryLabel;
                    }
                }
                
                return experiences;
            });

            closeDialog(nodeDialog);
        } catch (error) {
            setSnackbarInfo({key: Math.random(), message: (error as Error).message, success: false});
        }
    }, [nodes])
    const closeDialog = useCallback((nodeDialog: any) => {
        setOpenDialog(nodeDialog, false)
    }, [])

    useImperativeHandle(ref, () => {
        return {
            getFlowData: () => {
                return {
                    nodes,
                    edges,
                    nodesDialog
                }
            }
        };
    }, [nodes, edges, nodesDialog]);

    log('Main rendered', nodes, edges, nodesDialog);

    return (
        <div className="dndflow">
            <div className="reactflow-wrapper" ref={reactFlowWrapper} style={{ height: "calc(100vh - 250px)" }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onInit={setReactFlowInstance}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    nodeTypes={nodeTypes}
                    onNodeClick={onNodeClick}
                    onEdgeClick={onEdgeClick}
                    fitView
                >
                    <Background />
                </ReactFlow>
            </div>
            {
                nodesDialog.map(nodeDialog => {
                    let jsx = <></>;
                    if (nodeDialog.open) {
                        jsx = <Dialog nodeDialog={nodeDialog} saveNodeData={saveNodeData}
                        close={() => closeDialog(nodeDialog)} checkifDTMFGotRepeated={checkifDTMFGotRepeated}  />;
                    }
                    return jsx;
                })
            }
            <Snackbar snackbarInfo={snackbarInfo} />
        </div>
    )
})

export default memo(Flow);