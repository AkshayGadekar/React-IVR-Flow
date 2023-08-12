import { log } from "../../../../../setup/funcs/helpers";

export const isCardAlreadyLinked = (params: Record<string, any>, edges: Record<string, any>[]) => {
    const target = params.target;
    const linkedEdgesToTarget = edges.filter(edge => edge.target === target);
    
    const totalLinks =  linkedEdgesToTarget.length;
    
    if (totalLinks) {
        throw new Error("Oops!!! Card is already linked");  
    }
}

export const isCardAlreadyPresent = (node: Record<string, any>, nodes: Record<string, any>[]) => {
    const module = node.data.module;
    const id = node.data.id;
    
    const sameCards = nodes.filter(eachNode => {
        return eachNode.data.module === module && eachNode.data.id === id
    });
    const totalSameCards = sameCards.length;
    
    if (totalSameCards) {
        throw new Error("Oops!!! Card is already present");
    }    
}

export const isCardGettingLinkedToCorrectCard = (params: Record<string, any>, nodes: Record<string, any>[]) => {
    const source = params.source;
    const target = params.target;

    const sourceCard = nodes.filter(eachNode => eachNode.id === source)[0];
    const targetCard = nodes.filter(eachNode => eachNode.id === target)[0];

    const sourceCardModule = sourceCard.data.module;
    const targetCardModule = targetCard.data.module;

    if (source === "node_0") {
        if (targetCard) {
            if (targetCardModule !== "Experience") {
                throw new Error("Main Menu can have only Experience cards under it");
            }
        } 
    } else {
        if (sourceCard) {
            if (sourceCardModule === 'Experience') {
                if (targetCardModule !== "Category") {
                    throw new Error("Experience card can have only Category cards under it");
                }

                const experienceId = sourceCard.data.id;
                const categoryParentId = targetCard.data.parentId;
                if (experienceId !== categoryParentId) {
                    throw new Error("Category does not belong to parent Experience");
                }
            }   
        }
    }
}

export const isDTMFGotRepeated = (selectedNodeDialog: Record<string, any>, nodesDialog: Record<string, any>[], data: Record<string, any>) => {
    const module = selectedNodeDialog.module;
    const DTMF = data.dtmf_digit;
    
    let DTMFs: number[] = [];

    if (module === 'Experience') {
        const experienceNodesDialog = nodesDialog.filter(nodeDialog => nodeDialog.module === module);
        DTMFs = experienceNodesDialog
        .filter(experienceNodeDialog => experienceNodeDialog.id !== selectedNodeDialog.id)
        .map(experienceNodeDialog => experienceNodeDialog.data.dtmf_digit);
    } else if (module === 'Category') {
        const module_parent_id = selectedNodeDialog.module_parent_id;
        const childCategoryNodesDialog = nodesDialog.filter(nodeDialog => 
            nodeDialog.module_parent_id === module_parent_id && nodeDialog.module === module);
        DTMFs = childCategoryNodesDialog
        .filter(childCategoryNodeDialog => childCategoryNodeDialog.id !== selectedNodeDialog.id)
        .map(childCategoryNodeDialog => childCategoryNodeDialog.data.dtmf_digit);
    }
    
    const isDTMFRepeated = DTMFs.includes(DTMF);
    if (isDTMFRepeated) {
        throw new Error("Selected DTMF already in use");
    }
}

export const isAllCardsConnected = (nodes: Record<string, any>[], edges: Record<string, any>[]) => {
    const totalNodes = nodes.length;
    const totalEdges = edges.length;
    if ((totalNodes - 1) !== totalEdges) {
        throw new Error("Please link all cards");
    }
}

export const isAllCardsSubmitted = (nodesDialog: Record<string, any>[]) => {
    const cardsNotNeededToBeSubmitted: string[] = ["UserInput"];
    nodesDialog.forEach(nodeDialog => {
        if (!cardsNotNeededToBeSubmitted.includes(nodeDialog.type) && !nodeDialog.isSubmitted) {
            throw new Error(`Please save ${nodeDialog.type} card having label '${nodeDialog.data.name}'`);
        }
    });
}

export const isEmpty = (nodes: Record<string, any>[]) => {
    const totalNodes = nodes.length;
    if (totalNodes === 1) {
        throw new Error("Please configure proper IVR Flow");
    }
}

export const isAnyExperienceCardNotLinked = (nodes: Record<string, any>[], edges: Record<string, any>[]) => {
    nodes.forEach(node => {
        if (node.type === "experience") {
            const id = node.id;
            const linkedTargetsCount = edges.filter(edge => edge.source === id).length;
            if (!linkedTargetsCount) {
                throw new Error(`Please link ${node.type} card having label '${node.data.label}' to at least one category card`);
            }
        }
    });
}