import React, {useState, useContext, useMemo} from 'react'
import {useFormik} from 'formik'
import * as Yup from 'yup'
import clsx from 'clsx'
import {log} from '../../../../../../setup/funcs/helpers'
import withAxios from '../../../../../../setup/HOC/withAxios'
import {WithAxiosProps} from '../../../../../../setup/types/funcs'
import {flowContext} from '../../Index'
import Select from 'react-select'

type Props = WithAxiosProps & {
  close: () => void
  nodeDialog: any
  saveNodeData: (node: any, data: Record<string, any>) => void
}

const alphaNumericRegExp = /^[a-zA-Z0-9]*$/
const urlRegExp =
  /^(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})$/

const editSchema = Yup.object().shape({
  name: Yup.string().required('Name is required').min(1, 'Minimum 1 characters'),
  //.max(20, 'Maximum 20 characters').matches(alphaNumericRegExp, 'Only alphanumeric characters allowed')
  input_type: Yup.string()
    .required('Input Type is required')
    .min(1, 'Minimum 1 characters')
    .max(20, 'Maximum 20 characters')
    .matches(alphaNumericRegExp, 'Only alphanumeric characters allowed'),
  dtmf_digit: Yup.number()
    .required('DTMF digit is required')
    .min(1, 'DTMF must be between 1-9')
    .max(9, 'DTMF must be between 1-9'),
  prompt: Yup.number().required('Please select prompt'),
})

const ExperienceDialog = (props: Props) => {
  const {prompts} = useContext(flowContext)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const data = props.nodeDialog.data
  const [initialValues] = useState({
    name: data.name || '',
    input_type: 'DTMF',
    dtmf_digit: data.dtmf_digit || '',
    prompt: data.prompt || '',
  })

  const formik = useFormik({
    initialValues: initialValues,
    validationSchema: editSchema,
    validateOnBlur: true,
    onSubmit: async (values, {setSubmitting}) => {
      log('values', values)
      props.saveNodeData(props.nodeDialog, values)
      //props.close();
    },
  })

  const options = useMemo(() => {
    const promptsAsOptions: Record<string, any>[] = prompts.map((prompt) => ({
      value: prompt.id,
      label: prompt.name,
    }))
    return promptsAsOptions
  }, [])
  const selectedPrompt = useMemo(() => {
    return options.find((option) => option.value === formik.values.prompt)
  }, [])

  log('ExperienceDialog rendered', formik.errors)

  return (
    <>
      <form className='form' onSubmit={formik.handleSubmit}>
        <div
          className='d-flex flex-column scroll-y me-n7 pe-7'
          id='experience_modal'
          data-kt-scroll='true'
          data-kt-scroll-activate='{default: false, lg: true}'
          data-kt-scroll-max-height='auto'
          data-kt-scroll-dependencies='#experience_modal_header'
          data-kt-scroll-wrappers='#experience_modal_scroll'
          data-kt-scroll-offset='300px'
        >
          <div className='fv-row mb-7'>
            <label className='required fw-bold fs-6 mb-2'>Card Name</label>

            <input
              placeholder='Name'
              {...formik.getFieldProps('name')}
              type='text'
              className={clsx(
                'form-control form-control-solid mb-3 mb-lg-0',
                {'is-invalid': formik.touched.name && formik.errors.name},
                {
                  'is-valid': formik.touched.name && !formik.errors.name,
                }
              )}
              autoComplete='off'
              readOnly
              disabled
            />
            {formik.touched.name && formik.errors.name && (
              <div className='fv-plugins-message-container'>
                <div className='fv-help-block'>
                  <span role='alert'>{formik.errors.name as string}</span>
                </div>
              </div>
            )}
          </div>

          <div className='fv-row mb-7'>
            <label className='required fw-bold fs-6 mb-2'>Input Type</label>

            <input
              placeholder='Input Type'
              {...formik.getFieldProps('input_type')}
              type='text'
              className={clsx(
                'form-control form-control-solid mb-3 mb-lg-0',
                {'is-invalid': formik.touched.input_type && formik.errors.input_type},
                {
                  'is-valid': formik.touched.input_type && !formik.errors.input_type,
                }
              )}
              autoComplete='off'
              readOnly
              disabled
            />
            {formik.touched.input_type && formik.errors.input_type && (
              <div className='fv-plugins-message-container'>
                <div className='fv-help-block'>
                  <span role='alert'>{formik.errors.input_type as string}</span>
                </div>
              </div>
            )}
          </div>

          <div className='fv-row mb-7'>
            <label className='required fw-bold fs-6 mb-2'>Select DTMF Digit</label>

            <input
              placeholder='Select DTMF Digit'
              {...formik.getFieldProps('dtmf_digit')}
              onKeyDown={(e) =>
                ['e', 'E', '+', '-', '.'].includes(e.key) ? e.preventDefault() : true
              }
              type='number'
              min={1}
              max={9}
              className={clsx(
                'form-control form-control-solid mb-3 mb-lg-0',
                {'is-invalid': formik.touched.dtmf_digit && formik.errors.dtmf_digit},
                {
                  'is-valid': formik.touched.dtmf_digit && !formik.errors.dtmf_digit,
                }
              )}
              autoComplete='off'
            />
            {formik.touched.dtmf_digit && formik.errors.dtmf_digit && (
              <div className='fv-plugins-message-container'>
                <div className='fv-help-block'>
                  <span role='alert'>{formik.errors.dtmf_digit as string}</span>
                </div>
              </div>
            )}
          </div>

          <div className='fv-row mb-7'>
            <label className='required fw-bold fs-6 mb-2'>Select Prompt</label>

            <Select
              options={options}
              defaultValue={selectedPrompt}
              className='prompt-single'
              classNamePrefix='prompt'
              name='prompt'
              isClearable={true}
              isSearchable={true}
              escapeClearsValue={true}
              menuPlacement={'auto'}
              menuPosition='fixed'
              menuShouldBlockScroll={true}
              placeholder='Select Prompt...'
              noOptionsMessage={() => 'No prompts available'}
              onChange={(value) => {
                formik.setFieldValue('prompt', value?.value || '')
                formik.setFieldTouched('prompt', true, false)
              }}
              menuIsOpen={undefined}
            />
            {formik.touched.prompt && formik.errors.prompt && (
              <div className='fv-plugins-message-container'>
                <div className='fv-help-block'>
                  <span role='alert'>{formik.errors.prompt as string}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className='text-center pt-3'>
          <button
            type='reset'
            onClick={() => props.close()}
            className='btn btn-light me-3'
            data-kt-providers-modal-action='cancel'
            disabled={formik.isSubmitting}
          >
            Cancel
          </button>

          <button
            type='submit'
            className='btn btn-primary'
            data-kt-providers-modal-action='submit'
            disabled={!(formik.dirty && formik.isValid) || isSubmitted}
          >
            {!isSubmitted ? (
              <span className='indicator-label'>Submit</span>
            ) : (
              <span className='indicator-progress d-block'>
                Please wait...{' '}
                <span className='spinner-border spinner-border-sm align-middle ms-2'></span>
              </span>
            )}
          </button>
        </div>
      </form>
    </>
  )
}

export default withAxios(ExperienceDialog)
