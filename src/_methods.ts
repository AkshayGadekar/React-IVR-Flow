export const getProcessedNode = (nodes: Record<string, any>[], cards: Record<string, any>[]) => {
    const modifiedNodes = nodes?.map((node: Record<string, any>, index) => {
        const id: number|null = node.data?.id || null;
        const module: string|null = node.data?.module || null;

        let label = node.data.label;
        if (id && module) {
            const newLabel = getLabel({id, module}, cards);
            if (newLabel) label = newLabel; 
        }
        node.data.label = label;
        return node;
    });
    return modifiedNodes;
}

export const getProcessedNodeDialogs = (nodeDialogs: Record<string, any>[], cards: Record<string, any>[]) => {
    const modifiedNodeDialogs = nodeDialogs?.map((nodeDialog: Record<string, any>, index) => {
        const id: number|null = nodeDialog.module_id || null;
        const module: string|null = nodeDialog.module || null;

        let label = nodeDialog.data.name;
        if (id && module) {
            const newLabel = getLabel({id, module}, cards);
            if (newLabel) label = newLabel; 
        }
        nodeDialog.data.name = label;
        return nodeDialog;
    });
    return modifiedNodeDialogs;
}

const getLabel = (nodeModuleInfo: {id: number, module: string}, cards: Record<string, any>[]): string => {
    let label = "";
    switch (nodeModuleInfo.module) {
        case 'Experience':
            label = getExperienceLabel(nodeModuleInfo.id, cards);   
            break;
        case 'Category':
            label = getCategoryLabel(nodeModuleInfo.id, cards);    
            break;
        default:
            break;
    }
    return label;
}

const getExperienceLabel = (id: number, cards: Record<string, any>[]): string => {
    let label = "";
    const experience = cards.find(card => card.id == id);
    if (experience) {
        label = experience.name;   
    }
    return label;
}

const getCategoryLabel = (id: number, cards: Record<string, any>[]): string => {
    let label = "";
    let category: Record<string, any> | undefined;
    const isCategoryNotFound = cards.every(card => {
        const matchedCategory = card.categories.find((category: Record<string, any>) => category.id == id);
        if (matchedCategory) {
            category = matchedCategory;
            return false;
        }
        return true;
    });
    if (category) {
        label = category.name;   
    }
    return label;
}