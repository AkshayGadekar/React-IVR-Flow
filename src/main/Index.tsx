import React, {useState, useRef, useContext, useCallback, useMemo, useEffect} from 'react';
import clsx from 'clsx';
import {isAllCardsConnected, isAllCardsSubmitted, isEmpty, isAnyExperienceCardNotLinked} from "./validations";
import withAxios from '../../../../../setup/HOC/withAxios';
import {WithAxiosProps} from "../../../../../setup/types/funcs"
import {ReactFlowProvider} from 'reactflow';
import {flowContext} from "../Index";
import {createItem, updateItem} from "../../list/core/_requests";
import Flow from "./Flow";
import { log, callAfterTimeout } from '../../../../../setup/funcs/helpers';
import { useNavigate, useParams } from 'react-router-dom';
import {alphaRegex, repetitionRegex, spaceRegex} from "../../../../../setup/objects/objects";

type Props =  WithAxiosProps

type flowData = {nodes: Record<string, any>[], edges: Record<string, any>[], nodesDialog: Record<string, any>[]}

const alphaNumericRegExp = /^[a-zA-Z0-9]*$/;

const Index = (props: Props) => {

    const {flowData: {name: flowName, mapped_queue: queuesObj}} = useContext(flowContext);

    const [name, setName] = useState(flowName || '');
    const [nameError, setNameError] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [buttonType, setButtonType] = useState("save")
    const [createdId, setCreatedId] = useState<number>();

    const queues = useMemo(() => {
        let queueNames = "-";
        if (queuesObj) {
            queueNames = queuesObj.map((queue: Record<string, any>) => queue.experience_info.name).join(", ");
        }
        return queueNames;
    }, []);

    const getFlowDataRef = useRef<{
        getFlowData: () => flowData
    }>(null);

    const navigate = useNavigate();
    const params = useParams();
    const id = params.id;
    
    let create = true;
    if (id) {
        create = false;
    }

    const handleName = (ev: React.ChangeEvent<HTMLInputElement>) => {

        const name = ev.target.value;
    
        let error = false;
        if (name == '') {
            setNameError('Name is required');
            error = true;
        } else
        if (name.length > 40) {
            setNameError('Name cannot exceed 40 characters');
            error = true;
        } else
        if (!alphaRegex.test(name)) {
            setNameError(`${process.env.REACT_APP_ALPHA_REGEX_ERROR}`);
            error = true;
        } else
        if (repetitionRegex.test(name)) {
            setNameError(`${process.env.REACT_APP_REPETITION_REGEX_ERROR}`);
            error = true;
        } else
        if (spaceRegex.test(name)) {
            setNameError(`${process.env.REACT_APP_SPACE_REGEX_ERROR}`);
            error = true;
        }
    
        setName(name);
        if (!error) {
          setNameError('')
        }
    }
    
    const discard = () => {
        navigate("/ivr/flow/list");
    }

    const submitFlow = (ev: React.MouseEvent<HTMLButtonElement>) => {
        ev.preventDefault();
        const {nodes, edges, nodesDialog}: flowData = getFlowDataRef.current!.getFlowData();
        
        try {
            isEmpty(nodes);
            isAllCardsConnected(nodes, edges);
            isAllCardsSubmitted(nodesDialog);
            isAnyExperienceCardNotLinked(nodes, edges);
            
            if (!nameError && name) {
                const buttonType = (ev.target as HTMLButtonElement).dataset.buttonType;
                setIsSubmitted(true);
                setButtonType(buttonType || "save");
                
                const data = {name, nodes, edges, nodesDialog};
                log('data', data);
                let apiCall: Promise<any>;
                if (create && !createdId) {
                    apiCall = createItem(data)  
                } else {
                    apiCall = updateItem(id || createdId, data)
                }
                
                apiCall
                .then((res) => {

                    const successResponse = res.data;
                    log('successResponse', successResponse);

                    props.setSnackbarInfo({success: true, message: `Experience Flow saved successfully`});
                    props.setShowSnackBar(true);
                    
                    setCreatedId(successResponse.data.id);
                    
                    if (buttonType === 'close') {
                        callAfterTimeout(() => navigate("/ivr/flow/list"), 4000);
                    } else {
                        setIsSubmitted(false);
                    }
                        
                })
                .catch((error) => {
                    props.processAxiosError(error, props);
                    setIsSubmitted(false);
                })
                
            } else {
                setNameError('Name is required');
            }

        } catch (error) {
            props.processAxiosError(error as Error, props);
        }

    }

    log('SubmitFlow form rendered');

    return (
        <>
            <form className="row">
                <div className='fields-container col-sm-6 mb-2'>
                    <div className='fv-row mb-0'>
                        <input
                            placeholder='Name'
                            type='text'
                            className={clsx(
                            'form-control form-control-solid mb-0 mb-lg-0 bg-white',
                            )}
                            autoComplete='off'
                            value={name}
                            onChange={handleName}
                        />
                        {nameError && (
                            <div className='fv-plugins-message-container'>
                            <div className='fv-help-block'>
                                <span role='alert'>{nameError as string}</span>
                            </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className='btn-container col-sm-6 text-sm-start text-md-end mb-2'>
                    <button
                        type='button'
                        className='btn btn-secondary btn-sm me-3'
                        data-kt-providers-modal-action='submit'
                        disabled={isSubmitted || !!nameError}
                        onClick={submitFlow}
                        data-button-type="close"
                    >
                        {
                            (buttonType === "close" && isSubmitted && 
                            (
                                <span className='indicator-progress d-block'>
                                    <span className='spinner-border spinner-border-sm align-middle'></span>
                                </span>
                            ))
                            ||
                            "X"
                        }
                    </button>
                    <button
                        type='reset'
                        onClick={discard}
                        className='btn btn-secondary btn-sm me-3'
                        data-kt-providers-modal-action='cancel'
                        disabled={isSubmitted}
                    >
                        Cancel
                    </button>
                    <button
                        type='submit'
                        className='btn btn-primary btn-sm'
                        data-kt-providers-modal-action='submit'
                        disabled={isSubmitted || !!nameError}
                        onClick={submitFlow}
                        data-button-type="save"
                    >
                        {
                            (buttonType === "save" && isSubmitted && 
                            (
                                <span className='indicator-progress d-block'>
                                    <span className='spinner-border spinner-border-sm align-middle'></span>
                                </span>
                            ))
                            ||
                            "Save"
                        }
                    </button>
                </div>
                <div className='col-12 mb-2'>
                    <div className='fv-row mt-1 mb-0'>
                        <label className='fw-bold fs-6 me-2'>Queues:</label>
                        <div className='d-inline-flex flex-wrap'>
                            {queues}
                        </div>
                    </div>
                </div>
            </form>
            
            <ReactFlowProvider>
                <Flow ref={getFlowDataRef} />
            </ReactFlowProvider>   
        </>
    );
}

export default withAxios(Index);