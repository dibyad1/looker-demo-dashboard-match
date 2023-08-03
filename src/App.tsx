/*

 MIT License

 Copyright (c) 2021 Looker Data Sciences, Inc.

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.

 */

import React, { useContext, useEffect, useReducer } from 'react'
import { hot } from 'react-hot-loader/root'
import {
  Box,
  Button,
  MessageBar,
  Page,
  SpaceVertical,
  ProgressCircular,
  FieldText,
} from '@looker/components'
import { ExtensionContext } from '@looker/extension-sdk-react'
import type { ChangeEvent } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import { DashboardList } from './DashboardList'
import { DashboardEmbed } from './DashboardEmbed'
import { ActionWidgets } from './ActionWidgets'
import { reducer, initialState } from './state'
import {
  loadDashboardEmbeddings,
  getMatchingDashboardElements,
} from './dashboardData'
import styles from './styles.module.css'

const AppInternal = () => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [begin, setBegin] = React.useState(false)
  const [loaded, setLoaded] = React.useState(false)
  const {
    loadingEmbeddings,
    embeddings,
    query,
    loadingMatches,
    selectedDashboardId,
    matches,
    errorMessage,
  } = state

  const { core40SDK } = useContext(ExtensionContext)

  useEffect(() => {
    console.log('Loading embeddings')
    dispatch({
      type: 'EMBEDDINGS_LOAD',
    })
    const loadEmbeddings = async () => {
      try {
        const result = await loadDashboardEmbeddings(core40SDK)
        console.log('Embeddings loaded: ', result)
        dispatch({
          type: 'EMBEDDINGS_READY',
          payload: { embeddings: result },
        })
      } catch (error) {
        dispatch({
          type: 'EMBEDDINGS_FAIL',
        })
      }
    }
    loadEmbeddings()
  }, [core40SDK])

  useEffect(() => {
    if(matches && matches.length > 0) {
      // don't load if already loaded
      if(matches[0].id !== selectedDashboardId) {
        document.getElementById('embedcontainer')?.style.setProperty('opacity', '0')
        dispatch({ payload: { selectedDashboardId: matches[0].id }, type: 'SET_STATE' })
      }
    }
  },[matches])

  const onDashboardSelected = (id: string) => {
    if (!selectedDashboardId || selectedDashboardId !== id) {
      document.getElementById('embedcontainer')?.style.setProperty('opacity', '0')
      dispatch({ payload: { selectedDashboardId: id }, type: 'SET_STATE' })
    }
  }

  // if (loadingEmbeddings)
  //   return (
  //     <Box p="large" display="flex" justifyContent="center" alignItems="center">
  //       <ProgressCircular size="large" />
  //     </Box>
  //   )

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'SET_STATE',
      payload: { query: e.currentTarget.value },
    })
  }

  const handleSubmit = async () => {
    dispatch({ type: 'MATCHES_LOAD' })
    const matches = await getMatchingDashboardElements({
      query,
      embeddings,
      top: 3,
    })
    if (typeof matches !== 'string') {
      dispatch({ type: 'MATCHES_COMPLETE', payload: { matches } })
    }
  }

  return (
    <Page height="100%">
      {errorMessage && (
        <MessageBar intent="critical">{errorMessage}</MessageBar>
      )}
      {/* <Header
        py="large"
        px={['medium', 'medium', 'large', 'large', 'xxxlarge', 'xxxlarge']}
      > */}
        {!begin && <LandingPage begin={setBegin} embeddings={embeddings}/>}
        {begin &&
          <SpaceVertical>
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              // padding: '2rem',
              alignItems: 'center',
              width: '100%',
              height: '100%'
            }}>
            <div style={{
              width:'40vw',
              padding:'2rem',
              height:'100vh',
              borderRight:'1px solid #ccc'
            }}>
            <span style={{
              fontSize:'4rem',
              fontWeight:'bold',
              fontFamily:'sans-serif',
              letterSpacing:'-0.1rem',
              lineHeight:'4.5rem',
              marginBottom:'1rem',
              display:'block',
              textAlign:'left',
              width:'auto',
              height:'auto',
              border:'none',
            }}>Dashboard Match</span>
            <h3 style={{color:'rgb(26, 115, 232)'}}>Powered by Generative AI with Google</h3>
            <div style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  flexDirection: 'row'
            }}>
              <FieldText
                label="Find me a dashboard with..."
                value={query}
                onChange={handleChange}
                width={window.innerWidth > 768 ? '70%' : 'auto'}
                />
              <Button onClick={handleSubmit}>Go</Button>
            </div>
            {loadingMatches && <BardLogo search={true} />}
            {matches.length > 0 && (
              <DashboardList
              dashboards={matches}
              selectDashboard={onDashboardSelected}
              current={selectedDashboardId}
              />
              )}
            </div>
            <div style={{
              height:'100vh',
              width:'100%',
              backgroundColor: '#f7f7f7',
              zIndex: 1
            }}>
            {!selectedDashboardId && !loaded && (
              <BardLogo />
            )}
            {selectedDashboardId  && (
              <div style={{
                backgroundColor: '#f7f7f7',
                height:'100vh',
                width:'100%',
              }}>
              <DashboardEmbed dashboardId={selectedDashboardId}/>
              </div>
            )}
            </div>
            </div>
            {/* <ActionWidgets /> */}
          </SpaceVertical>
        }
    </Page>
  )
}

const LandingPage = ({begin, embeddings}) => {
  const docs = [
    {
      title:'Generate Embeddedings',
      model:'embeddings-gecko-001',
      description:'Generative Embeddings Model by Google. Used to Generate Embeddings for Dashboard Metadata. Ultimately used for report matching.',
      doc:'https://developers.generativeai.google/tutorials/embeddings_quickstart'
    },
    {
      title:'Generate Text',
      model:'text-bison-001',
      description:'Generative Text Model by Google. Used to Generate Dashboard Summary and spotlight key tile match.',
      doc:'https://developers.generativeai.google/tutorials/text_quickstart'
    }
  ]

  return (
    <SpaceVertical>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            alignContent: 'center',
            width: '100%',
            height: '100%',
            padding:'2rem',
            paddingTop:'10rem',
            zIndex:1
          }}>
          <div style={{
            width:'40vw'
          }}>
          <span style={{
            fontSize:'4rem',
            fontWeight:'bold',
            fontFamily:'sans-serif',
            letterSpacing:'-0.1rem',
            lineHeight:'4.5rem',
            marginBottom:'1rem',
            display:'block',
            textAlign:'left',
            width:'100%',
            // height:'100%',
            border:'none',
          }}>Dashboard Match</span>
          <h3 style={{color:'rgb(26, 115, 232)'}}>Powered by Generative AI with Google</h3>
          {!embeddings || embeddings.length <= 0 ? <ProgressCircular size="large" /> :  <Button onClick={() => begin(true)}>Begin</Button>}
          {docs.map((doc) => {
            return (
              <a href={doc.doc} style={{textDecoration:'none'}} target="_blank">
              <div style={{
                cursor: 'pointer',
                width:'100%',
                height:'18vh',
                backgroundColor:'white',
                marginTop:'2rem',
                borderRadius:'5px',
                display:'flex',
                flexDirection:'row',
              }}>
                <div style={{
                  width:'20%',
                  height:'auto',
                  borderRight:'1px solid #ccc',
                }}>
                  <img height="70%" width="70%" src="https://developers.generativeai.google/static/site-assets/images/marketing/home/icon-palm.webp"/>
                </div>
                <div style={{
                  paddingTop:'1rem',
                  paddingLeft:'1rem',
                  width:'80%',
                  height:'auto',
                  display:'flex',
                  flexDirection:'column',
                  // justifyContent:'space-between',
                }}>
                  <span style={{
                    height:'auto',
                    fontSize:'1.5rem',
                    fontWeight:'bold',
                    fontFamily:'sans-serif',
                    letterSpacing:'-0.1rem',
                    display:'block',
                    textAlign:'left',
                    width:'100%',
                    color:'black',
                    // height:'100%',
                    border:'none',
                  }}>{doc.title}</span>
                  <p style={{color:'rgb(26, 115, 232)',fontSize:'0.8rem',}}>{doc.model}</p>
                  <p style={{fontSize:'0.8rem',width:'auto',height:'auto',color:'black',opacity:0.8}}>{doc.description}</p>
                </div>
              </div>
              </a>
            )
          })}
          </div>
          </div>
        </SpaceVertical>
  )
}

export interface BardLogoProps {
  search?: boolean | undefined
}

const BardLogo = (
  {search}: BardLogoProps
) => {
  const SVG = () => (
    <svg width="100%" height="100%" viewBox={search ? "-600 -300 9000 2500" : "0 -800 700 3000"} fill="none">
      <path className={styles.bard}
        d="M515.09 725.824L472.006 824.503C455.444 862.434 402.954 862.434 386.393 824.503L343.308 725.824C304.966 638.006 235.953 568.104 149.868 529.892L31.2779 477.251C-6.42601 460.515 -6.42594 405.665 31.2779 388.929L146.164 337.932C234.463 298.737 304.714 226.244 342.401 135.431L386.044 30.2693C402.239 -8.75637 456.159 -8.75646 472.355 30.2692L515.998 135.432C553.685 226.244 623.935 298.737 712.234 337.932L827.121 388.929C864.825 405.665 864.825 460.515 827.121 477.251L708.53 529.892C622.446 568.104 553.433 638.006 515.09 725.824Z" fill="url(#paint0_radial_2525_777)"/>
      <path d="M915.485 1036.98L903.367 1064.75C894.499 1085.08 866.349 1085.08 857.481 1064.75L845.364 1036.98C823.765 987.465 784.862 948.042 736.318 926.475L698.987 909.889C678.802 900.921 678.802 871.578 698.987 862.61L734.231 846.951C784.023 824.829 823.623 783.947 844.851 732.75L857.294 702.741C865.966 681.826 894.882 681.826 903.554 702.741L915.997 732.75C937.225 783.947 976.826 824.829 1026.62 846.951L1061.86 862.61C1082.05 871.578 1082.05 900.921 1061.86 909.889L1024.53 926.475C975.987 948.042 937.083 987.465 915.485 1036.98Z" fill="url(#paint1_radial_2525_777)"/>
      <defs>
      <radialGradient id="paint0_radial_2525_777" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(670.447 474.006) rotate(78.858) scale(665.5 665.824)">
      <stop stopColor="#1BA1E3"/>
      <stop offset="0.0001" stopColor="#1BA1E3"/>
      <stop offset="0.300221" stopColor="#5489D6"/>
      <stop offset="0.545524" stopColor="#9B72CB"/>
      <stop offset="0.825372" stopColor="#D96570"/>
      <stop offset="1" stopColor="#F49C46"/>
      <animate attributeName="r" dur="5000ms" from="0" to="1" repeatCount="indefinite" />
      </radialGradient>
      <radialGradient id="paint1_radial_2525_777" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(670.447 474.006) rotate(78.858) scale(665.5 665.824)">
      <stop stopColor="#1BA1E3"/>
      <stop offset="0.0001" stopColor="#1BA1E3"/>
      <stop offset="0.300221" stopColor="#5489D6"/>
      <stop offset="0.545524" stopColor="#9B72CB"/>
      <stop offset="0.825372" stopColor="#D96570"/>
      <stop offset="1" stopColor="#F49C46"/>
      <animate attributeName="r" dur="5000ms" from="0" to="1" repeatCount="indefinite" />
      </radialGradient>
      </defs>
    </svg>
  )
  return (
    <>
      {search ? 
        <div style={{
          display:'flex',
          flexDirection:'row'
        }}>
        <h3 style={{color:'rgb(26, 115, 232)'}}>Matching</h3>
        {SVG()}
        </div>
      :
      <>
        {SVG()}
      </>
      }
    </>
  )
  }

export const App = hot(AppInternal)
