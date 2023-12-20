import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Box, TextField, Button, Grid, Paper } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Description, Assignment, BugReport, ListAlt, CheckCircleOutline } from '@mui/icons-material';

interface BDDTestCase {
  testcase_desc: string;
}

interface AcceptanceCriteria {
  description: string;
}

interface Story {
  description: string;
  storyid: string;
  title: string;
  bdd_testcases: BDDTestCase[];
  acceptance_criteria: AcceptanceCriteria[];
  status: string;
}

interface SafetyRating {
  category: string;
  probability: string;
}

interface Part {
  text: string;
}

interface Content {
  role: string;
  parts: Part[];
}

interface Candidate {
  content: Content;
  safetyRatings: SafetyRating[];
}

interface ResponseItem {
  candidates: Candidate[];
}


function App() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story>();
  const API_ENDPOINT="us-central1-aiplatform.googleapis.com"
  const PROJECT_ID="telephonybot-384617"
  const MODEL_ID="gemini-pro"
  const LOCATION_ID="us-central1"
  const genAI = new GoogleGenerativeAI(
    "AIzaSyCYY7a0T-PqCjXoTNne4lpQM8AszQG7bqs"
  );
  const renderStoryIdCell = (params: any) => (
    <Box display="flex" alignItems="center">
      <Assignment sx={{ mr: 1 }} />
      <Typography>{params.value}</Typography>
    </Box>
  );
  const columns = [
    { field: 'storyid', headerName: 'ID', width: 150,renderCell: renderStoryIdCell  },
    { field: 'title', headerName: 'Title', width: 200 },
    { field: 'description', headerName: 'Description', width: 400 },
    { field: 'status', headerName: 'Status', width: 200 },
    // Add more columns as needed based on the story structure
  ];
  const handleRowClick = (params: any) => {
    const story = stories.find(story => story.storyid === params.id);
    setSelectedStory(story);
  };
  
  /**const handleGenerateClick1 = async () => {
   /* const generatedText = await generateStory(inputText);
    setOutputText(generatedText);
  
    try {
      const jsonText = generatedText.replace("JSON Text: ", "").trim();
      console.log("before parsing:",jsonText);
      const parsedStories: Story[] = JSON.parse(jsonText);
      console.log("after parsing:",parsedStories);
      setStories(parsedStories);
    } catch (error) {
      console.error('Error parsing stories:', error);
    
      const generatedText = await generateStory(inputText);
    //  setOutputText(generatedText);
    
      try {
        // Parse the initial response to access the 'candidates' array
        const initialResponse = JSON.parse(generatedText);
        const candidates = initialResponse.candidates || [];
    
        // Extract text from 'parts' and concatenate
        const extractedText = candidates.flatMap((candidate: { content: { parts: { text: any; }[]; }; }) =>
          candidate.content.parts.map((part: { text: any; }) => part.text)
        ).join('');
    
        // The extracted text is expected to be a JSON string of stories
        const stories = JSON.parse(extractedText);
        setStories(stories); // Assuming setStories is your state update function
      } catch (error) {
        console.error('Error processing response:', error);
      }
      };
      
    
 */
  
  
      const handleGenerateClick = async () => {
        const generatedTextResponse = await generateStory(inputText) || '';
       
           
        if (typeof generatedTextResponse === 'string') {
          // If the response is a string, proceed with parsing
          const cleanText = generatedTextResponse
          .replace(/```json/g, '') // Remove ```json
          .replace(/```/g, '')      // Remove any remaining ```
          .trim();  
          setOutputText(cleanText);
          try {
            const initialResponse = JSON.parse(cleanText);
            const candidates = initialResponse.candidates || [];
      
            const extractedText = candidates.flatMap((candidate: { content: { parts: any[]; }; }) =>
              candidate.content.parts.map((part: { text: any; }) => part.text)
            ).join('');
      
          //  const stories = JSON.parse(extractedText);
            setStories(initialResponse); // Assuming setStories is your state update function
          } catch (error) {
            console.error('Error processing response:', error);
          }
        } else {
          // Handle the case when generatedTextResponse is not a string
          console.error('Generated text is not a string:', generatedTextResponse);
        }
      };
      

  async function generateStory(userInput: string) {
    const prompt = `Act as scrum master and generate stories based on the description.  Include acceptance criteria and BDD test cases. Do not include any explanations, only provide a  RFC8259 compliant JSON response  following this format without deviation.
    [{
      "storyid": "Id of the story",
      "title": "story title",
      "description":"description",
      "bdd_testcases": [{
        "testcase_desc": "testcase description"
      }],
      "acceptance_criteria":[{
        "description":"acceptance criteria description"
      }],
      "status":"ToDo"
    }] \nHere is the context:${userInput}`;

    const contents = `[
      {
          role: "user",
          parts: [
              {
                  "text": "Act as a scrum master and generate stories based on the description. Include acceptance criteria and BDD test cases. . Do not include any explanations, only provide a RFC8259 compliant JSON response following this format without deviation.
 [{
 storyid: "Id of the story",
 title: "story title",
   description:"description",
   bdd_testcases: [{
    testcase_desc: "testcase description"
   }],
   acceptance_criteria:[{
    description:"acceptance criteria description"
   }],
   status:ToDo
  }] 
.Here is the context: ${userInput} also generate it as JIRA story as it is in the text attribute of the response"
              }
          ]
      }
  ]`;
  try {
   const model = genAI.getGenerativeModel({ model: "gemini-pro" });
   const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.candidates && response.candidates.length > 0 ? response.candidates[0].content.parts[0].text : "";
    console.log("Response:",response);
   // setApiData(text);
   // const endpoint = "https://api.openai.com/v1/engines/text-davinci-003/completions";
   /* const endpoint = `https://${API_ENDPOINT}/v1beta1/projects/${PROJECT_ID}/locations/${LOCATION_ID}/publishers/google/models/${MODEL_ID}:streamGenerateContent`
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization':`Bearer ya29.a0AfB_byBIWLmLD7WVpJtfPzANSGXWYiI5_D3Vny51mYNiYAmr6QH_cGZQSjEhJG5SIo_F6qL1Pq84WbvfO7rPn1YvdTXvo58yQQj5uyCHNV-gzH50UK2d_aJo_uxU4uQqJmZZZUDMaBh46f3NLoHU5Wjj9EbJIKawWHq1nZRG1j8aCgYKAfkSARASFQHGX2Mi171sEUy5PMv0IpYP-mST2A0178`
          //'Authorization': `Bearer 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`
        },
        body: JSON.stringify({ contents: [{role:"user",parts:[{text:prompt}]}], 
          generation_config: {
              maxOutputTokens: 2048,
              temperature: 0.7,
              topP: 1,
              topK: 32
          } })
      });
  
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
  
      const data = await response.json();
      return data.choices[0].text;*/
      return text;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return "Failed to generate story.";
    }
  }
  

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Agile Stories Creator
          </Typography>
        </Toolbar>
      </AppBar>
      <Box sx={{ padding: 2 }}>
        <Grid container spacing={2} alignItems="center" justifyContent="center">
          <Grid item xs={5}>
            <TextField
              fullWidth
              label="Input Story"
              multiline
              rows={5}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </Grid>
          <Grid item xs={2}>
            <Button variant="contained" onClick={handleGenerateClick}>
              Generate Stories
            </Button>
          </Grid>
          <Grid item xs={5}>
            <TextField
              fullWidth
              label="Generated Story"
              multiline
              rows={20}
              value={outputText}
              InputProps={{ readOnly: true }}
            />
            <Box sx={{ position: 'relative' }}>
              <Button 
                variant="contained" 
                onClick={() => alert("Additional Action")}
                sx={{ position: 'absolute', bottom: -50, right: 0 }}
              >
                Create JIRA Stories
              </Button>
            </Box>
          </Grid>
        </Grid>
        <Grid container spacing={2} sx={{ marginTop: 10 }}>
          <Grid item xs={6}>
            <div style={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={stories}
                columns={columns}
                getRowId={(row) => row.storyid}
                onRowClick={handleRowClick}
              />
            </div>
          </Grid>
          <Grid item xs={6}>
         <Paper sx={{ p: 2, height: 'auto', my: 2 }}>
  {selectedStory ? (
    <Box>
      <Box display="flex" alignItems="center" mb={2}>
        <ListAlt sx={{ mr: 1 }} />
        <Typography variant="h6">{selectedStory.title}</Typography>
      </Box>
      <Box display="flex" alignItems="center" mb={2}>
        <Description sx={{ mr: 1 }} />
        <Typography>{selectedStory.description}</Typography>
      </Box>
     
      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Acceptance Criteria:</Typography>
      {selectedStory.acceptance_criteria.map((criteria, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <CheckCircleOutline sx={{ mr: 1, fontSize: 'inherit' }} />
          <Typography>{criteria.description}</Typography>
        </Box>
      ))}
      <Box display="flex" alignItems="center" mb={2}>
        <BugReport sx={{ mr: 1 }} />
        <Typography>BDD Test Cases:</Typography>
        {selectedStory.bdd_testcases.map((testcase, index) => (
          <Typography key={index} sx={{ ml: 4 }}>{testcase.testcase_desc}</Typography>
        ))}
      </Box>
      {/* Repeat for Acceptance Criteria and other fields */}
    </Box>
  ) : (
    <Typography>Select a story to see details</Typography>
  )}
</Paper>


          </Grid>
              </Grid>
      </Box>
    </Box>
  );
}

export default App;
