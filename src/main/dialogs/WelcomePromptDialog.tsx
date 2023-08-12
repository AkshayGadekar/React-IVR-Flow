import React, {useState, useContext, useCallback, useMemo} from 'react'
import {useFormik} from 'formik'
import * as Yup from 'yup'
import clsx from 'clsx'
import {ID} from '../../../../../../../_metronic/helpers'
import {callAfterTimeout, log} from '../../../../../../setup/funcs/helpers'
import withAxios from '../../../../../../setup/HOC/withAxios'
import {WithAxiosProps} from '../../../../../../setup/types/funcs'
import {flowContext} from '../../Index'
import Select from 'react-select'

type Props = WithAxiosProps & {
  close: () => void
  nodeDialog: any
  saveNodeData: (node: any, data: Record<string, any>) => void
}

const editSchema = Yup.object().shape({
  invalid_prompt: Yup.number().nullable(),
  timeout_prompt: Yup.number().nullable(),
  skip_to_next_menu_dtmf_digit: Yup.string()
    .required('Skip to Next Menu DTMF Digit is required')
    .matches(/^[0-9\*#]{1}$/, 'Only digit or * or # is allowed'),
  skip_to_next_menu_prompt: Yup.number().required('Skip to Next Menu Prompt is required'),
  main_menu_dtmf_digit: Yup.string()
    .required('Main Menu DTMF Digit is required')
    .matches(/^[0-9\*#]{1}$/, 'Only digit or * or # is allowed'),
  main_menu_prompt: Yup.number().required('Main Menu Prompt is required'),
  exit_prompt: Yup.number().nullable(),
  //interdigit_timeout: Yup.number().required("Interdigit Timeout is required").min(1, 'Interdigit Timeout must be between 1-9').max(9, 'Interdigit Timeout must be between 1-9'),
  general_timeout: Yup.number()
    .required('General Timeout is required')
    .min(1, 'General Timeout must be between 1-9')
    .max(9, 'General Timeout must be between 1-9'),
  retry_count: Yup.number()
    .nullable()
    .min(1, 'Retry Count must be between 1-9')
    .max(9, 'Retry Count must be between 1-9'),
})

const WelcomePromptDialog = (props: Props) => {
  const {prompts} = useContext(flowContext)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const data = props.nodeDialog.data
  const create = !data.prompts
  const [initialValues] = useState({
    name: data.name || '',
    invalid_prompt: data.invalid_prompt || '',
    timeout_prompt: data.timeout_prompt || '',
    skip_to_next_menu_dtmf_digit: '*',
    skip_to_next_menu_prompt: data.skip_to_next_menu_prompt || '',
    main_menu_dtmf_digit: '#',
    main_menu_prompt: data.main_menu_prompt || '',
    exit_prompt: data.exit_prompt || '',
    //interdigit_timeout: data.interdigit_timeout || "",
    general_timeout: data.general_timeout || '',
    retry_count: data.retry_count || '',
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
  const invalidSelectedPrompt = useMemo(() => {
    return options.find((option) => option.value === formik.values.invalid_prompt)
  }, [])
  const timeoutSelectedPrompt = useMemo(() => {
    return options.find((option) => option.value === formik.values.timeout_prompt)
  }, [])
  const skipToNextMenuSelectedPrompt = useMemo(() => {
    return options.find((option) => option.value === formik.values.skip_to_next_menu_prompt)
  }, [])
  const mainMenuSelectedPrompt = useMemo(() => {
    return options.find((option) => option.value === formik.values.main_menu_prompt)
  }, [])
  const exitSelectedPrompt = useMemo(() => {
    return options.find((option) => option.value === formik.values.exit_prompt)
  }, [])

  log('WelcomePromptDialog rendered', formik.errors, formik.values)

  return (
    <>
      <form className='form' onSubmit={formik.handleSubmit}>
        <div
          className='d-flex flex-column scroll-y me-n7 pe-7'
          id='welcome_prompt_modal'
          data-kt-scroll='true'
          data-kt-scroll-activate='{default: false, lg: true}'
          data-kt-scroll-max-height='auto'
          data-kt-scroll-dependencies='#welcome_prompt_modal_header'
          data-kt-scroll-wrappers='#welcome_prompt_modal_scroll'
          data-kt-scroll-offset='300px'
        >
          <div className='row'>
            <div className='fv-row mb-7 col-lg-6 col-12'>
              <label className='fw-bold fs-6 mb-2'>Invalid Prompt</label>

              <Select
                options={options}
                defaultValue={invalidSelectedPrompt}
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
                  formik.setFieldValue('invalid_prompt', value?.value || '')
                  formik.setFieldTouched('invalid_prompt', true, false)
                }}
                menuIsOpen={undefined}
              />
              {formik.touched.invalid_prompt && formik.errors.invalid_prompt && (
                <div className='fv-plugins-message-container'>
                  <div className='fv-help-block'>
                    <span role='alert'>{formik.errors.invalid_prompt as string}</span>
                  </div>
                </div>
              )}
            </div>

            <div className='fv-row mb-7 col-lg-6 col-12'>
              <label className='fw-bold fs-6 mb-2'>Timeout Prompt</label>

              <Select
                options={options}
                defaultValue={timeoutSelectedPrompt}
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
                  formik.setFieldValue('timeout_prompt', value?.value || '')
                  formik.setFieldTouched('timeout_prompt', true, false)
                }}
                menuIsOpen={undefined}
              />
              {formik.touched.timeout_prompt && formik.errors.timeout_prompt && (
                <div className='fv-plugins-message-container'>
                  <div className='fv-help-block'>
                    <span role='alert'>{formik.errors.timeout_prompt as string}</span>
                  </div>
                </div>
              )}
            </div>

            <div className='fv-row mb-7 col-lg-6 col-12'>
              <label className='required fw-bold fs-6 mb-2'>Skip To Next Menu Prompt</label>

              <div className='fv-row mb-2'>
                <label className='fs-7 mb-2'>DTMF Digit</label>
                <input
                  placeholder='DTMF Digit'
                  {...formik.getFieldProps('skip_to_next_menu_dtmf_digit')}
                  type='text'
                  className={clsx(
                    'form-control form-control-solid mb-3 mb-lg-0',
                    {
                      'is-invalid':
                        formik.touched.skip_to_next_menu_dtmf_digit &&
                        formik.errors.skip_to_next_menu_dtmf_digit,
                    },
                    {
                      'is-valid':
                        formik.touched.skip_to_next_menu_dtmf_digit &&
                        !formik.errors.skip_to_next_menu_dtmf_digit,
                    }
                  )}
                  autoComplete='off'
                  readOnly
                  disabled
                />
                {formik.touched.skip_to_next_menu_dtmf_digit &&
                  formik.errors.skip_to_next_menu_dtmf_digit && (
                    <div className='fv-plugins-message-container'>
                      <div className='fv-help-block'>
                        <span role='alert'>
                          {formik.errors.skip_to_next_menu_dtmf_digit as string}
                        </span>
                      </div>
                    </div>
                  )}
              </div>
              <div className='fv-row'>
                <label className='fs-7 mb-2'>Prompt</label>
                <Select
                  options={options}
                  defaultValue={skipToNextMenuSelectedPrompt}
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
                    formik.setFieldValue('skip_to_next_menu_prompt', value?.value || '')
                    formik.setFieldTouched('skip_to_next_menu_prompt', true, false)
                  }}
                  menuIsOpen={undefined}
                />
                {formik.touched.skip_to_next_menu_prompt && formik.errors.skip_to_next_menu_prompt && (
                  <div className='fv-plugins-message-container'>
                    <div className='fv-help-block'>
                      <span role='alert'>{formik.errors.skip_to_next_menu_prompt as string}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className='fv-row mb-7 col-lg-6 col-12'>
              <label className='required fw-bold fs-6 mb-2'>Go To Main Menu Prompt</label>

              <div className='fv-row mb-2'>
                <label className='fs-7 mb-2'>DTMF Digit</label>
                <input
                  placeholder='DTMF Digit'
                  {...formik.getFieldProps('main_menu_dtmf_digit')}
                  type='text'
                  className={clsx(
                    'form-control form-control-solid mb-3 mb-lg-0',
                    {
                      'is-invalid':
                        formik.touched.main_menu_dtmf_digit && formik.errors.main_menu_dtmf_digit,
                    },
                    {
                      'is-valid':
                        formik.touched.main_menu_dtmf_digit && !formik.errors.main_menu_dtmf_digit,
                    }
                  )}
                  autoComplete='off'
                  readOnly
                  disabled
                />
                {formik.touched.main_menu_dtmf_digit && formik.errors.main_menu_dtmf_digit && (
                  <div className='fv-plugins-message-container'>
                    <div className='fv-help-block'>
                      <span role='alert'>{formik.errors.main_menu_dtmf_digit as string}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className='fv-row'>
                <label className='fs-7 mb-2'>Prompt</label>
                <Select
                  options={options}
                  defaultValue={mainMenuSelectedPrompt}
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
                    formik.setFieldValue('main_menu_prompt', value?.value || '')
                    formik.setFieldTouched('main_menu_prompt', true, false)
                  }}
                  menuIsOpen={undefined}
                />
                {formik.touched.main_menu_prompt && formik.errors.main_menu_prompt && (
                  <div className='fv-plugins-message-container'>
                    <div className='fv-help-block'>
                      <span role='alert'>{formik.errors.main_menu_prompt as string}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className='fv-row mb-7 col-lg-6 col-12'>
              <label className='fw-bold fs-6 mb-2'>Exit Prompt</label>

              <Select
                options={options}
                defaultValue={exitSelectedPrompt}
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
                  formik.setFieldValue('exit_prompt', value?.value || '')
                  formik.setFieldTouched('exit_prompt', true, false)
                }}
                menuIsOpen={undefined}
              />
              {formik.touched.exit_prompt && formik.errors.exit_prompt && (
                <div className='fv-plugins-message-container'>
                  <div className='fv-help-block'>
                    <span role='alert'>{formik.errors.exit_prompt as string}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className='row'>
            <div className='fv-row mb-7 col-lg-6 col-12'>
              <label className='required fw-bold fs-6 mb-2'>General Timeout</label>

              <input
                placeholder='General Timeout'
                {...formik.getFieldProps('general_timeout')}
                onKeyDown={(e) =>
                  ['e', 'E', '+', '-', '.'].includes(e.key) ? e.preventDefault() : true
                }
                type='number'
                min={1}
                max={9}
                className={clsx(
                  'form-control form-control-solid mb-3 mb-lg-0',
                  {'is-invalid': formik.touched.general_timeout && formik.errors.general_timeout},
                  {
                    'is-valid': formik.touched.general_timeout && !formik.errors.general_timeout,
                  }
                )}
                autoComplete='off'
              />
              {formik.touched.general_timeout && formik.errors.general_timeout && (
                <div className='fv-plugins-message-container'>
                  <div className='fv-help-block'>
                    <span role='alert'>{formik.errors.general_timeout as string}</span>
                  </div>
                </div>
              )}
            </div>

            <div className='fv-row mb-7 col-lg-6 col-12'>
              <label className='fw-bold fs-6 mb-2'>Retry Count</label>

              <input
                placeholder='Retry Count'
                {...formik.getFieldProps('retry_count')}
                onKeyDown={(e) =>
                  ['e', 'E', '+', '-', '.'].includes(e.key) ? e.preventDefault() : true
                }
                type='number'
                min={1}
                max={9}
                className={clsx(
                  'form-control form-control-solid mb-3 mb-lg-0',
                  {
                    'is-invalid':
                      formik.touched.retry_count &&
                      formik.values.retry_count &&
                      formik.errors.retry_count,
                  },
                  {
                    'is-valid':
                      formik.touched.retry_count &&
                      formik.values.retry_count &&
                      !formik.errors.retry_count,
                  }
                )}
                autoComplete='off'
              />
              {formik.touched.retry_count && formik.errors.retry_count && (
                <div className='fv-plugins-message-container'>
                  <div className='fv-help-block'>
                    <span role='alert'>{formik.errors.retry_count as string}</span>
                  </div>
                </div>
              )}
            </div>
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

export default withAxios(WelcomePromptDialog)
