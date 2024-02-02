from cloud_services.llm_services import get_llm_client, AzureLLMClients
from cloud_services.azure_cog_service import AzureSearchService
import os
from dotenv import load_dotenv
import re, json
from conversation.prompt_templates.search_string_prompt import get_search_prompt, get_keyword_prompt
from conversation.prompt_templates.refine_questions_prompt import get_questions_prompt
from cloud_services.openai_response_objects import ChatCompletion, Message
from settings.settings import Settings
settings = Settings()
load_dotenv()


class SearchRetriever:
    def __init__(self, llm_client, search_client):
        self.azure_llm : AzureLLMClients  = llm_client        
        self.search_client : AzureSearchService = search_client
        
    def retrieve_content(self,query: str,n=3 ) -> list:
        results, questions, followups, keywords = self.search_client.simple_search(query,settings.KB_FIELDS_CONTENT,n)
        return results, questions, followups, keywords
    
    @staticmethod
    def parse_questions(string):
          questions =  re.findall(r'Question: (.*?)\n', string)
          return questions[:2]
    
    @staticmethod
    def split_questions(text):
        split_text = re.split(r'\n|\?|\d+\.\s*', text)
        cleaned_text = [item.strip()+'?' for item in split_text if item.strip()]
        return cleaned_text
    
    def get_search_string(self, input):
        prompt = get_search_prompt(input)
        default_messages = [
            Message(role='system', content=prompt),
        ]
        result : ChatCompletion = self.azure_llm.chat(default_messages)
        return result.choices[0].message.content
    
    def get_keyword_string(self, input, user_info):
        prompt = get_keyword_prompt(input, user_info)
        default_messages = [
            Message(role='system', content=prompt),
        ]
        result : ChatCompletion = self.azure_llm.chat(default_messages)
        return result.choices[0].message.content
    
    def refine_questions(self, user_info, input):
        prompt = get_questions_prompt(user_info, input)
        default_messages = [
            Message(role='system', content=prompt),
            ]
        result : ChatCompletion = self.azure_llm.chat(default_messages)
        result = self.split_questions(result.choices[0].message.content)
        return result
    
    def generate_questions(self, user_info):
         search_string = self.get_search_string(user_info)
         content, qs, fus, kw = self.retrieve_content(search_string,n=10)
         result = self.refine_questions(user_info, qs)
         return result
    
    def generate_content_and_questions(self, query, user_info):
         search_string = self.get_keyword_string(query, user_info)
         content, qs, fus, kw = self.retrieve_content(search_string, n=10)
         refined_qs = self.refine_questions(user_info, fus)
         return content, refined_qs, kw
    
    @classmethod           
    def with_default_settings(cls):
        from cloud_services.llm_services import get_llm_client
        from cloud_services.azure_cog_service import AzureSearchService

        azure_llm = get_llm_client(api_type='azure',
                                api_version=settings.OPENAI_API_VERSION,
                                endpoint=settings.AZURE_OPENAI_ENDPOINT,
                                model=settings.MODEL_NAME,
                                deployment=settings.DEPLOYMENT_NAME,
                                embedding_deployment=settings.EMBEDDING)

        # Create an instance of the class with these default settings
        return cls(
            ll_client=azure_llm,
            search_client=AzureSearchService(settings.SEARCH_ENDPOINT,
                                                settings.SEARCH_INDEX_NAME,
                                                azure_llm,
                                                settings.SEARCH_API_KEY),
        )

    
if __name__ == "__main__":
    retriever = SearchRetriever.with_default_settings()
    from pathlib import Path

    file_path = Path('app/data/test_user.json')
    with open(file_path, 'r') as f:
        data = json.load(f)

    user_info = json.dumps(data)
    print(retriever.generate_content_and_questions("what classes do I need to graduate?", user_info))
    print(retriever.generate_questions(user_info))