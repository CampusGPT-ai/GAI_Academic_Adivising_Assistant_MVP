import { Box, Typography, useTheme } from "@mui/material";
import React, { FC, useEffect, useState } from "react";
import "../../assets/styles.css";
import messageSample from "../../model/messages/messageSample.json";
import ParentMessage, {Followup, Citation} from "../../model/messages/messages";
import ChatInput from "./chatElements/chatInput";
import ChatMessages from "./chatElements/chatMessageContainer";


/**
 * this component is the active chat component that is displayed when the user is in a chat.
 * it renders chat messages based on conversation history, and sends new questions back to the post request, 
 * either from clicking on a sample question or typing in the input box.
 * 
 */
/**
 * Props for the ChatActive component.
 * @interface
 * @property {boolean} isLoading - Indicates if the chat is currently loading.
 * @property {boolean} [isError] - Indicates if there was an error while loading the chat.
 * @property {Array<Message>} messages - An array of messages in the chat.
 * @property {function} [onRetry] - A function to retry loading the chat in case of an error.
 * @property {string} [error] - The error message to display in case of an error.
 * @property {string} [convoTitle] - The title of the conversation.
 * @property {Array<string>} [sampleQuestions] - An array of sample questions to display.
 * @property {function} sendChatClicked - A function to handle sending a chat message.
 */
interface ChatActiveProps {
  isLoading: boolean; //can remove
  isError?: boolean;
  chatResponse?: string;
  follow_up_questions?: Followup[];
  citations?: Citation[];
  error?: string;
  messageHistory: ParentMessage[];  //optional history on selected conversation
  convoTitle?: string; //is conversation active, or id?? 
  sampleQuestions?: Array<string>;
  sendChatClicked: (text: string) => void;
  currentAnswerRef: React.MutableRefObject<any>;
  sourceOpen: boolean;
}[]

const ChatActive: FC<ChatActiveProps> = ({
  chatResponse,
  follow_up_questions,
  citations,
  convoTitle,
  isLoading,
  isError,
  error,
  sampleQuestions,
  messageHistory,
  sendChatClicked,
  currentAnswerRef,
  sourceOpen
}) => {

  const [userQuestion, setUserQuestion] = useState('');
  const theme = useTheme()

  /**
   * Sets the message state to the input text.
   * @param inputText - The text to set as the message state.
   */
  const handleSendClick = (inputText: string) => {
    setUserQuestion(inputText);
  };

  /**
   * Sets the message state to the provided question text.
   * @param questionText - The text of the question to set as the message.
   */
  const handleQuestionClick = (questionText: string) => {
    setUserQuestion(questionText)
  };

  const handleRetry = () => {
    userQuestion != '' && userQuestion && sendChatClicked(userQuestion)
  }

  /**
   * activates the call back function when the message state is changed.
   */
  useEffect(() => {
    if (userQuestion.trim() !== '' && userQuestion !== undefined) {
      sendChatClicked(userQuestion);
    }
  },[userQuestion])

  
  const loggingStatement = ((message: string) => {
    console.log(message)
  })
  //console.log(`passing loading and error states.  loading: ${isLoading} error: ${isError}`)
  return (
    <Box sx={{alignItems: "center", 
    width: "95%", p: 2,
    display: "flex",
    flexDirection: "column",
    borderRadius: 2, 
    flexWrap: "wrap",
    boxShadow: 3, 
    overflow: 'hidden',
    backgroundColor: theme.palette.primary.light,
    }}>
      {messageHistory && messageHistory.length>0 ? (
        <>
        {loggingStatement(`mesage history recieved: ${messageHistory}`)}
          <Typography variant="h2" sx={{ mb: 4 }}>{convoTitle}</Typography>
          <ChatMessages
            chatResponse={chatResponse}
            follow_up_questions={follow_up_questions}
            citations={citations}
            messageHistory={messageHistory}
            isLoading={isLoading}
            isError={isError}
            onFollowupClicked={handleQuestionClick}
            onRetry={handleRetry}
            error={error}
            currentAnswerRef={currentAnswerRef}
          />
        </>
      ) : (
        <>
        <Box justifyContent="center" mt="100px" width="100%" display="flex">
          <Typography variant="h2" sx={{ mb: 4 }}>What's on your mind today?<br></br><br></br></Typography>
          </Box>
          
    
        </>
      )}
      <ChatInput 
      sendChat={handleSendClick}
      sourceOpen={sourceOpen}
      isLoading={isLoading}></ChatInput>
    </Box>
  );
  
};


//for default props in storybook
const jsonString = JSON.stringify(messageSample);
const sampleMessages = JSON.parse(jsonString) as ParentMessage[];
const sampleQuestions = [
  "How are you?",
  "What's your name?",
  "What's your favorite color?",
];


ChatActive.defaultProps = {
  messageHistory: sampleMessages,
  sampleQuestions: sampleQuestions,
};

export default ChatActive;
