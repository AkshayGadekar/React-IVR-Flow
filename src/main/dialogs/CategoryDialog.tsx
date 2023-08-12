import React, {useState, useContext, useRef, useMemo, useEffect} from 'react'
import {useFormik} from 'formik'
import * as Yup from 'yup'
import clsx from 'clsx'
import {uploadFile} from '../../../list/core/_requests'
import {
  callAfterTimeout,
  log,
  getDuration,
  getFormData,
} from '../../../../../../setup/funcs/helpers'
import withAxios from '../../../../../../setup/HOC/withAxios'
import {WithAxiosProps} from '../../../../../../setup/types/funcs'
import {flowContext} from '../../Index'
import AudioPlayer from '../../../../../../../_metronic/helpers/components/utilities/AudioPlayer'
import DropFile from '../../../../../../../_metronic/helpers/components/utilities/DropFile'
import Select from 'react-select'

type Props = WithAxiosProps & {
  close: () => void
  nodeDialog: any
  saveNodeData: (node: any, data: Record<string, any>) => void
  checkifDTMFGotRepeated: (nodeDialog: any, data: Record<string, any>) => boolean
}

const alphaNumericRegExp = /^[a-zA-Z0-9]*$/

const CategoryDialog = (props: Props) => {
  const {playlists, prompts} = useContext(flowContext)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const imperativeRef = useRef(null)

  const requestControllerRef = useRef<AbortController>()
  let apiFailed: boolean

  const data = props.nodeDialog.data
  const create = !data.input_type
  const [initialValues] = useState({
    name: data.name || '',
    input_type: 'DTMF',
    dtmf_digit: data.dtmf_digit || '',
    upload_audio: data.upload_audio || 'playlist',
    playlist: data.playlist || '',
    audio: data.audio || '',
    file_name: data.file_name || '',
    duration: data.duration || '',
    file_path: data.file_path || '',
    prompt: data.prompt || '',
  })

  const editSchema = useMemo(
    () =>
      Yup.object().shape({
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
        upload_audio: Yup.string().required().oneOf(['playlist', 'audio']),
        playlist: Yup.number().when('upload_audio', {
          is: 'playlist',
          then: Yup.number().required('Please select playlist'),
        }),
        // audio: create ? Yup.string().when('upload_audio', {
        //   is: 'audio',
        //   then: Yup.string().required('Please upload audio')
        // }) : Yup.string().when('upload_audio', {
        //   is: 'audio',
        //   then: Yup.string().nullable()
        // }),
        audio: Yup.mixed().nullable(),
        prompt: Yup.number().required('Please select prompt'),
      }),
    [create]
  )

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

  const emptyUnnecessaryFields = (values: typeof initialValues) => {
    if (values.upload_audio === 'playlist') {
      values.file_path = ''
    }
    return values
  }

  const getPlaylist = (ev: React.ChangeEvent) => {
    if (formik.values.upload_audio == 'playlist') {
      formik.setFieldValue(
        'playlist',
        (ev.target as HTMLInputElement).value ? Number((ev.target as HTMLInputElement).value) : ''
      )

      setTimeout(() => {
        formik.setFieldValue('audio', '')
        formik.setFieldValue('duration', '')
        formik.setFieldValue('file_name', '')
        formik.setFieldValue('file_path', '')
        ;(imperativeRef.current as any).clearDroppedFileStates()
      })
    }
  }

  const getFile = async (file: File) => {
    if (formik.values.upload_audio == 'audio') {
      //const normal_base64 = await getBase64(file);
      //const pure_base64 = (normal_base64 as string).replace("data:", "").replace(/^.+,/, "").replace(/^\/\//, "");

      formik.setFieldValue('audio', file)
      formik.setFieldTouched('audio', true)
      getDuration(file, formik.setFieldValue, false)
      formik.setFieldValue('file_path', '')

      setTimeout(() => {
        formik.setFieldValue('playlist', '')
      })
    }
  }

  const removeFile = () => {
    if (requestControllerRef.current) {
      requestControllerRef.current!.abort()
    }

    formik.setFieldValue('audio', '')
    //sometimes formik validation does not run in sync
    setTimeout(() => {
      formik.validateForm()
      //formik.setFieldTouched('file', true, true);
    })

    let duration = ''
    let file_name = ''
    let file_path = ''
    if (!create) {
      duration = data.duration
      file_name = data.file_name
      file_path = data.file_path
    }
    formik.setFieldValue('duration', duration)
    formik.setFieldValue('file_name', file_name)
    formik.setFieldValue('file_path', file_path)
  }

  const saveCategoryCard = async (ev: React.FormEvent) => {
    ev.preventDefault()

    const values = formik.values

    const isDTMFGotRepeated: boolean = props.checkifDTMFGotRepeated(props.nodeDialog, values)
    if (isDTMFGotRepeated) {
      return
    }

    if (values.upload_audio === 'audio' && values.audio === '' && !values.file_path) {
      formik.setFieldError('audio', 'Please upload audio')
      return
    }

    apiFailed = false
    let fileUpload = false
    if (values.upload_audio === 'audio' && values.audio !== '') {
      fileUpload = true
      requestControllerRef.current = new AbortController()
      const formData = getFormData({ivr_file: values.audio})

      setIsSubmitted(true)

      await uploadFile(
        formData,
        (imperativeRef.current! as any).progressRef.current!,
        requestControllerRef.current
      )
        .then((res) => {
          const successResponse = res.data
          log('successResponse', successResponse)

          const file_path = successResponse.data.filepath

          formik.setFieldValue('audio', '')
          formik.setFieldValue('file_path', file_path)

          props.setSnackbarInfo({success: true, message: `Audio uploaded successfully`})
          props.setShowSnackBar(true)
        })
        .catch((error) => {
          props.processAxiosError(error, props)
          setIsSubmitted(false)
          apiFailed = true
        })
    }

    if (!apiFailed) {
      callAfterTimeout(() => formik.handleSubmit(), fileUpload ? 1500 : 0)
    }
  }

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

  useEffect(() => {
    return () => {
      if (requestControllerRef.current) {
        requestControllerRef.current!.abort('Request aborted to clean up useEffect.')
      }
    }
  }, [])

  log('CategoryDialog rendered', formik.errors, formik.values, data)

  return (
    <>
      <form className='form' onSubmit={saveCategoryCard}>
        <div
          className='d-flex flex-column scroll-y me-n7 pe-7'
          id='category_modal'
          data-kt-scroll='true'
          data-kt-scroll-activate='{default: false, lg: true}'
          data-kt-scroll-max-height='auto'
          data-kt-scroll-dependencies='#category_modal_header'
          data-kt-scroll-wrappers='#category_modal_scroll'
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
            <label className='required fw-bold fs-6 mb-2'>Choose Audio</label>

            <div className='d-flex fv-row mb-2'>
              <div className='form-check form-check-custom form-check-solid  w-100'>
                <input
                  className='form-check-input align-self-start me-3'
                  {...formik.getFieldProps('upload_audio')}
                  type='radio'
                  id='select_playlist'
                  value='playlist'
                  checked={formik.values.upload_audio === 'playlist'}
                />
                <div className='w-100'>
                  <select
                    className='form-select form-select-solid d-inline-block'
                    {...formik.getFieldProps('playlist')}
                    onChange={getPlaylist}
                  >
                    <option value={''}>Select From Playlist</option>
                    {playlists?.map((playlist: Record<string, any>, index: number) => (
                      <option key={index} value={playlist.id}>
                        {playlist.name}
                      </option>
                    ))}
                  </select>
                  {formik.errors.playlist && (
                    <div className='fv-plugins-message-container'>
                      <div className='fv-help-block'>
                        <span role='alert'>{formik.errors.playlist as string}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className='d-flex fv-row mb-2'>
              <div className='form-check form-check-custom form-check-solid  w-100'>
                <input
                  className='form-check-input align-self-start me-3'
                  {...formik.getFieldProps('upload_audio')}
                  type='radio'
                  id='select_audio'
                  value='audio'
                  checked={formik.values.upload_audio === 'audio'}
                />
                <div className='w-100'>
                  <DropFile
                    getFile={getFile}
                    remove={removeFile}
                    allowUpload={formik.values.upload_audio === 'audio'}
                    ref={imperativeRef}
                  />
                  {!create && formik.values.file_name && formik.values.audio != '' && (
                    <>
                      <strong>Audio: </strong>
                      {formik.values.file_name}
                    </>
                  )}
                  {!create && formik.values.file_path && formik.values.audio == '' && (
                    <AudioPlayer
                      fileName={formik.values.file_name}
                      url={`${
                        window.env?.REACT_APP_MUSIC_DOMAIN || process.env.REACT_APP_MUSIC_DOMAIN
                      }/${formik.values.file_path}`}
                      duration={formik.values.duration}
                    />
                  )}
                  {formik.errors.audio && (
                    <div className='fv-plugins-message-container'>
                      <div className='fv-help-block'>
                        <span role='alert'>{formik.errors.audio as string}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
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

export default withAxios(CategoryDialog)
