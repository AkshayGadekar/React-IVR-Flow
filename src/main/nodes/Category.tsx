import React from 'react'
import { Handle, Position } from 'reactflow';
import { log } from '../../../../../../setup/funcs/helpers';

const Category = (props: any) => {
  return (
    <div className="category-node text-center p-1 flex-wrap flex-column rounded-2">
        <Handle type="target" position={Position.Top} />
        <i className="bi bi-x fs-9 remove-node"></i>
        <i className="bi bi-grid text-white mb-1"></i>
        <div className='label-container'>
            {props.data.label}
        </div>
        {
            props.data.dtmf &&
            <div className='dtmf-choosen-container w-100 fs-9'>
                [{props.data.dtmf}]
            </div>
        }
    </div>
  )
}

export default Category;