import React from 'react'
import { Handle, Position } from 'reactflow';
import { log } from '../../../../../../setup/funcs/helpers';

const Start = (props: any) => {
  return (
    <div className="text-center">
        <i className="bi bi-play-circle-fill fs-1 text-primary"></i>
        <div className='start-text mb-1 fs-9'>Start</div>
        <Handle type="source" position={Position.Bottom} />
    </div>
  )
};

export default Start;

const UserInputComponent = () => {
  return (
    <div className="user-input-node bg-primary text-center p-1 flex-wrap">
        <i className="bi bi-x fs-9 remove-node"></i>
        <div className='label-container'>
            Main Menu
        </div>
        <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

