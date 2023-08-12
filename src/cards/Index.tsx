import React, {useContext} from 'react'
import {flowContext} from '../Index'

interface SideCardsInterface {}

const SideCards = (props: SideCardsInterface) => {
  const {experiences} = useContext(flowContext)
  const onDragStart = (event: React.DragEvent, nodeModuleAndLabel: string) => {
    event.dataTransfer.setData('application/reactflow', nodeModuleAndLabel)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      id='parent_accordion'
      className='cards-container p-3 border border-1 border-secondary'
      style={{height: 'calc(100vh - 170px)', overflowY: 'scroll'}}
    >
      <div className='experiences-container'>
        <div
          id='parent_accordion_header_1'
          data-bs-toggle='collapse'
          data-bs-target='#parent_accordion_body_1'
          aria-expanded='true'
          aria-controls='parent_accordion_body_1'
          className='heading experience-heading bg-primary p-1 ps-3 rounded'
        >
          Experiences
        </div>
        <div
          id='parent_accordion_body_1'
          aria-labelledby='parent_accordion_header_1'
          data-bs-parent='#parent_accordion'
          className='children row pt-3 m-auto justify-content-between collapse show'
        >
          {experiences.map((experience) => (
            <div className='card-container col-12 col-md-6 mb-5' key={experience.id}>
              <div
                className='flow-card experience-card bg-success p-2 text-center h-100 flex-column rounded-3'
                draggable
                onDragStart={(event) =>
                  onDragStart(event, `Experience/${experience.name}/${experience.id}`)
                }
              >
                <i className='bi bi-headphones text-white'></i>
                <div className='card-text'>{experience.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className='categories-container'>
        <div
          id='parent_accordion_header_2'
          data-bs-toggle='collapse'
          data-bs-target='#parent_accordion_body_2'
          aria-expanded='false'
          aria-controls='parent_accordion_body_2'
          className='heading category-heading last-heading bg-primary p-1 ps-3 rounded collapsed'
        >
          Categories
        </div>
        <div
          id='parent_accordion_body_2'
          aria-labelledby='parent_accordion_header_2'
          data-bs-parent='#parent_accordion'
          className='children pt-3 collapse'
        >
          <div id='children_accordion'>
            {experiences.map((experience, index) => (
              <>
                {experience.categories.length && experience.categories[0].id ? (
                  <div className=''>
                    <div
                      id={`children_accordion_header_${index}`}
                      data-bs-toggle='collapse'
                      data-bs-target={`#children_accordion_body_${index}`}
                      aria-expanded='false'
                      aria-controls={`children_accordion_body_${index}`}
                      className='heading custom-text-contrast fs-4 p-1 ps-3 collapsed d-flex align-items-center'
                      key={experience.id}
                    >
                      <i className='bi bi-plus me-1'></i>
                      <div className='text-overflow-ellipsis' title={experience.name}>
                        {experience.name}
                      </div>
                    </div>
                    <div
                      id={`children_accordion_body_${index}`}
                      aria-labelledby={`children_accordion_header_${index}`}
                      data-bs-parent='#children_accordion'
                      className='row justify-content-between pt-3 collapse'
                    >
                      {experience.categories.map((category: Record<string, any>) => (
                        <div className='card-container col-12 col-md-6 mb-5' key={category.id}>
                          <div
                            className='flow-card category-card p-2 text-center h-100 flex-column rounded-3'
                            draggable
                            onDragStart={(event) =>
                              onDragStart(
                                event,
                                `Category/${category.name}/${category.id}/${experience.id}`
                              )
                            }
                          >
                            <i className='bi bi-grid text-white mb-1'></i>
                            <div className='card-text'>{category.name}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <></>
                )}
              </>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SideCards
