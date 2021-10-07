import Head from "next/head";

import {
  Anchor,
  Box,
  Heading,
  Paragraph,
  Grid,
  CheckBoxGroup,
  TextInput,
  Button,
  Chart,
  Text,
  ResponsiveContext,
  Stack,
  DataTable
} from "grommet";

import { AddCircle } from 'grommet-icons';

import React, { useContext, useState } from "react";

export default function Home() {

  const [listOptions, setListOptions] = useState(['Frontend', 'BackEnd', 'React', 'Node']) //Use to store the list of keywords that can be scraped
  const [listValues, setListValues] = useState(listOptions) //Stores the selected options from the list that are sent to api for scraping
  const [textInputValue, setTextInputValue] = useState('') //Controlled form text input to add keywords to the listOptions state
  const [disableButton, setDisableButton] = useState(false) //Boolean to disable button as data fetch takes a long time - don't want multiple sends
  const [chartData, setChartData] = useState() //Storing the data that is returned from server used to plot chart
  const [timeToFetch, setTimeToFetch] = useState(0) //How long the fetch function takes to get data

  const size = useContext(ResponsiveContext); //size is small, medium or large depending on screen width

  const listener = (event) => { //Function used on textInput to catch enter and add textInput to listOptions
    console.log(event.key)
    if(event.key === 'Enter') {
      addToListOptions()
    }
  }

  const addToListOptions = () => { //Adds textInput to listOptions
    setListOptions([...listOptions, textInputValue])
    setListValues([...listValues, textInputValue])
    setTextInputValue('')
  }

  const scrapeButtonPress = () => { //Function to send listValues that are selected to api for data then process into chartData
    setDisableButton(true)
    const startTime = performance.now()
    let endTime
    const bodyData = {titles: listValues}
    postData('/api/jobstats', bodyData)
      .then(returnedData => {
        setChartData({
          total: returnedData.total,
          bounds: {x: returnedData.values.length, y: Math.ceil(Math.max(...returnedData.values.map(data => data.value)))},
          values: returnedData.values.map(data => {
            return { percentage: parseFloat(((data.value * 100) / returnedData.total).toFixed(2)), label: data.label, value: data.value}
          })
        })
      })
      .catch(error => console.log(error))
      .finally(() => {
        setDisableButton(false)
        endTime = performance.now()
        setTimeToFetch(endTime - startTime)
      })
  }

  const LabelledChart = ({ label, value }) => (
    <Box flex={false} basis="xsmall" align="center" gap="small">
      <Chart
        bounds={[
          [0, chartData.bounds.x], 
          [0, chartData.bounds.y]
        ]}
        type="bar"
        values={[{ value: [1, value] }]}
        round
        size={{ height: 'medium', width: 'xsmall' }}
      />
      <Box align="left" fill pad={{left: 'small'}}>
        <Text size="small" >{label}</Text>
      </Box>
    </Box>
  
  );

  const columns = [ //Column info for data table
    { 
      property: 'label', 
      header: 'Keyword', 
      size: 'small',
    },
    {
      property: 'value',
      header: 'Number of jobs',
      size: 'small',
      align: 'end',
    },
    {
      property: 'percentage',
      header: 'Percentage',
      size: 'small',
      align: 'end',
    },
  ];

  return ( 
    <Box 
      flex
      margin={{ horizontal: "auto" }}
      width={{ max: "100%" }}
      height={{ min: "100%" }}
    >
      <Head>
        <title>Job Site Stats</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Box background="brand">
          <Heading alignSelf='center'>
            Scrape some job site data from{" "}
            <Anchor href="https://www.cwjobs.co.uk/">
              CW Jobs
            </Anchor>
          </Heading>
      </Box>

      <Box flex role="main" pad={{ vertical: "medium", left: "medium", right: "large" }}>
    
        <Paragraph fill>
          Use this site to generate some live data on different keyword searches on a job site. Useful to see what languages or frameworks have more jobs listed than others. This site scrapes CW Jobs and may be shut down at any point.
        </Paragraph>
        <Paragraph fill>
          Press 'Scrape Data' to see what proportion of job listings contain that keyword. Please note the request will take time to fetch live data, be patient.
        </Paragraph>

        <Grid
          rows={['auto', 'auto']}
          columns={[size === "small"? '100%' : '1/3', size === "small"? 'auto' : '2/3']}
          gap="medium"
          areas={[
            { name: 'input', start: [0, 0], end: [0, 1] },
            { name: 'chart', start: size === "small"? [0, 1] : [1, 0], end: [1, 1] },
          ]}
        >
          <Box gridArea="input" background="light-5" flex>
            <Box pad="medium">
            <CheckBoxGroup
              pad={{bottom: "small"}}
              options={listOptions}
              value={listValues}
              onChange={({ value: nextValue }) => setListValues(nextValue)}
            />
            <Stack anchor="right">
              <TextInput 
                a11yTitle = "Add any keyword to search for"
                placeholder="Add keyword"
                value={textInputValue}
                onChange={event => setTextInputValue(event.target.value)}
                onKeyPress={event => listener(event)}
              />
              <Button 
                size="small"
                icon={<AddCircle color='brand'/>} 
                margin={{right: 'xsmall'}}
                onClick={addToListOptions}
              />
            </Stack>
            <Box pad={{top: "small"}}>
            <Button 
              primary label={disableButton ? "Scrapping..." : "Scrape Data"}
              disabled={disableButton}
              onClick={scrapeButtonPress}
            />
            </Box>
            </Box>
          </Box>
          <Box gridArea="chart" background="brand" pad="small">
          {chartData?
            <Text>
              Scraped {chartData.total} jobs in {timeToFetch /1000} seconds.
            </Text>
            :
            <Text>
              Press "Scrape Data" to generate a chart
            </Text>
          }
          <Box pad="medium" direction="row" gap="xsmall" margin={{right: 'small'}} overflow="auto">
          {chartData &&
            chartData.values.map(dataPoint => <LabelledChart key={dataPoint.label} label={dataPoint.label} value={dataPoint.value} />)    
          }
          </Box>
          </Box>
        </Grid>
        {chartData &&
          <DataTable columns={columns} data={chartData.values} primaryKey={false} margin={{top: "medium"}}/>
        }
      </Box>
    </Box>
  );
}

async function postData(url = '', data = {}) { //Generic function for sending POST JSON data via fetch (too small for own file?)
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response.json();
}