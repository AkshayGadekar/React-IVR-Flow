import React, {useMemo} from 'react'
import { KTSVG } from '../../../../../../../_metronic/helpers'
import { log } from '../../../../../../setup/funcs/helpers';
import ExperienceDialog from "./ExperienceDialog";
import CategoryDialog from "./CategoryDialog";
import WelcomePromptDialog from "./WelcomePromptDialog";

interface CreateDialogInterface {
  nodeDialog: any,
  close: () => void,
  saveNodeData: (nodeDialog: any, data: Record<string, any>) => void,
  checkifDTMFGotRepeated: (nodeDialog: any, data: Record<string, any>) => boolean
}

const Dialog = ({nodeDialog, close, saveNodeData, checkifDTMFGotRepeated}: CreateDialogInterface) => {
  
  log('nodeDialog', nodeDialog);
  
  return (
    <>
      <div
        className='modal fade show d-block'
        id='flow_card_dialog'
        role='dialog'
        tabIndex={-1}
        aria-modal='true'
      >
        <div className={`modal-dialog modal-dialog-centered ${nodeDialog.type === 'start' ? 'modal-xl' : 'mw-650px'}`}>
          <div className='modal-content'>
            <div className='modal-header'>
                <h2 className='fw-bolder'>{nodeDialog.data.name}</h2>
                <div
                    className='btn btn-icon btn-sm btn-active-icon-primary'
                    data-kt-users-modal-action='close'
                    onClick={() => close()}
                    style={{cursor: 'pointer'}}
                >
                    <KTSVG path='/media/icons/duotune/arrows/arr061.svg' className='svg-icon-1' />
                </div>
            </div>
            <div className='modal-body scroll-y m-2'>
                {nodeDialog.type === 'experience' && <ExperienceDialog close={close} nodeDialog={nodeDialog} saveNodeData={saveNodeData} />}
                {nodeDialog.type === 'category' && <CategoryDialog close={close} nodeDialog={nodeDialog} saveNodeData={saveNodeData} checkifDTMFGotRepeated={checkifDTMFGotRepeated} />}
                {nodeDialog.type === 'start' && <WelcomePromptDialog close={close} nodeDialog={nodeDialog} saveNodeData={saveNodeData} />}
            </div>
          </div>
        </div>
      </div>
      <div className='modal-backdrop fade show'></div>
    </>
  )
}

export default Dialog;