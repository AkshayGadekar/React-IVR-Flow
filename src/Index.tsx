import React, {useState, useMemo, useEffect, createContext, useRef} from 'react'
import {PageLink, PageTitle} from '../../../../../_metronic/layout/core'
import {useFormik} from 'formik'
import clsx from 'clsx'
import * as Yup from 'yup'
import { callAfterTimeout, log, emptyPromise } from '../../../../setup/funcs/helpers'
import {getItemById, getExperiences, getPlaylists, getPrompts} from "../list/core/_requests";
import withAxios from '../../../../setup/HOC/withAxios'
import {WithAxiosProps} from "../../../../setup/types/funcs"
import { useNavigate, useParams } from 'react-router-dom'
import {getProcessedNode, getProcessedNodeDialogs} from "./_methods";
import SpinnerLoader from "../../../../../_metronic/helpers/components/utilities/SpinnerLoader";
import SideCards from "./cards/Index";
import Main from "./main/Index";

type Props =  WithAxiosProps

const breadcrumbs: Array<PageLink> = [
    {
        title: 'Experience Flow Management',
        path: '/ivr/flow/list',
        isSeparator: false,
        isActive: false,
    },
    {
        title: '',
        path: '',
        isSeparator: true,
        isActive: false,
    }
]

interface flowContextInterface {
    playlists: Record<string, any>[], experiences: Record<string, any>[], prompts: Record<string, any>[], flowData: Record<string, any>,
    setExperiences: React.Dispatch<React.SetStateAction<Record<string, any>[]>>
}

export const flowContext = createContext<flowContextInterface>({playlists: [], experiences: [], prompts: [], flowData: {}, setExperiences: () => {}});

const Index = (props: Props) => {

    const [isFetching, setIsFetching] = useState<boolean>(true);
    const [experiences, setExperiences] = useState<Record<string, any>[]>([]);
    const [playlists, setPlaylists] = useState<Record<string, any>[]>([]);
    const [prompts, setPrompts] = useState<Record<string, any>[]>([]);
    const [flowData, setFlowData] = useState<Record<string, any>>({});

    const navigate = useNavigate();
    const params = useParams();
    const id: number = Number(params.id);
    
    let create = true;
    if (id) {
        create = false;
    }
    
    useEffect(() => {

        const requestController = new AbortController();
        
        (async () => {
            setIsFetching(true);

            const experiencesPromise = getExperiences('status=1', requestController);
            const playlistsPromise = getPlaylists('status=1', requestController);
            const promptsPromise = getPrompts('status=1', requestController);
            let flowPromise = await emptyPromise({data:{data:{}}}) as Promise<any>;
            if (!create) {
                flowPromise = getItemById(id, requestController);
            }

            const [experiencesResponse, playlistsResponse, flowResponse, promptsResponse] = await Promise.all(
                [experiencesPromise, playlistsPromise, flowPromise, promptsPromise]
            ).catch(error => console.log(error)) as [any, any, any, any];

            const experiencesData = experiencesResponse.data.data;
            const playlistsData = playlistsResponse.data.data;
            const promptsData = promptsResponse.data.data;
            let flowData = flowResponse.data.data;
            
            if (!create) {
                flowData = getModifiedFlowData(flowData, experiencesData);
            }

            setExperiences(experiencesData);
            setPlaylists(playlistsData);
            setPrompts(promptsData);
            setFlowData(flowData);

            setIsFetching(false);

        })();
        
        return () => {
            requestController.abort('Request aborted to clean up useEffect.');
        }
    }, [])

    const getModifiedFlowData = (data: Record<string, any>, cards: Record<string, any>[]) => {
        const nodes = data.nodes;
        const updatedNodes = getProcessedNode(nodes, cards);
        
        const nodeDialogs = data.nodeDialogs;
        const updatedNodeDialogs = getProcessedNodeDialogs(nodeDialogs, cards);
        
        data.nodes = updatedNodes;
        data.nodeDialogs = updatedNodeDialogs;
        
        return data;
    }

    log('Flow add rendered', experiences, playlists, prompts, flowData);

    return (
        <>
            <PageTitle breadcrumbs={breadcrumbs}>{create ? 'Add Experience Flow' : 'Edit Experience Flow'}</PageTitle>
            {
                isFetching ? <SpinnerLoader /> :
                <flowContext.Provider value={{playlists, experiences, prompts, flowData, setExperiences}}>
                    <div className='row mb-15'>
                        <div className='col-9'>
                            <Main />
                        </div>
                        <div className='col-3'>
                            <SideCards />
                        </div>
                    </div>
                </flowContext.Provider>
            }
        </>
    )
}

export default withAxios<Props>(Index)