import { createClient } from '@supabase/supabase-js';
import { SupabaseAuthClient } from '@supabase/supabase-js/dist/module/lib/SupabaseAuthClient';
import { Client, TextChannel } from 'discord.js';
const axios = require('axios');
interface Video{
  videoId: string;
  title: string;
  description: string;
  videoURL: string;

}

const server = Bun.serve({
    port: 3000,
    fetch(req) {
        const url = new URL(req.url);
      if(url.pathname === "/"){
        return new Response("Hello from!");
      }
      
    },
  });
  
  const API_KEY: string =  process.env.YOUTUBE_API_KEY;
  const CHANNEL_ID: string = "UCsBjURrPoezykLs9EqgamOA";
  const SUPABASE_URL: string = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY: string = process.env.SUPABASE_ANON_KEY;
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const RAPID_API_KEY: string = process.env.RAPID_API_KEY;

  console.log(`Listening on localhost:${server.port}`);
  //Discord BOT//////////////////////////////////////////
  const TOKEN: string = process.env.BOT_TOKEN;
  const DISCORD_CHANNEL_ID: string = process.env.CHANNEL_ID;

  const client = new Client({
    intents: ["Guilds", "GuildMessages", "DirectMessages"],
  });
  client.once('ready', () => {
      console.log('Bot is online!');
  });

  client.login(TOKEN);
  //////////////////////////////////////////////////////
  //RapidAPI///////////////////////////////////////////
  const optionsRapid: Dict<any> = {
    method: 'GET',
    url: 'https://youtube-v31.p.rapidapi.com/search',
  params: {
    part: 'snippet,id',
    channelId: 'UCsBjURrPoezykLs9EqgamOA',
    order: 'date'
  },
  headers: {
    'X-RapidAPI-Key': RAPID_API_KEY,
    'X-RapidAPI-Host': 'youtube-v31.p.rapidapi.com'
  }
};
  ///////////////////////////////////////////////////////
  




  setInterval(() => checkForUpdate(API_KEY, CHANNEL_ID), 300000);

const checkForUpdate = async(API_KEY: String, CHANNEL_ID: String): Promise<Video | null> =>  {
      
      
      try{
        const response = await axios.request(optionsRapid);
        const data = response.data;
        
        const title: string = data.items[0].snippet.title;
        const description: string = data.items[0].snippet.description;
        const videoId: string = data.items[0].id.videoId;
        const videoURL: string = `https://www.youtube.com/watch?v=${videoId}`;
        
        const body: Video = {
          videoId : videoId,
          description: description,
          title: title,
          videoURL: videoURL
        };
        
        getLatestEntry().then(async entry => {
          if(entry){
            console.log("Got data from DB.");
            
            if(entry.videoId !== videoId){
              const addVideoResponse = await addVideo(body);

              if(addVideoResponse){
                console.log('Fireship has uploaded a new video!');
              }
            }
          }else{
            console.log("Data not found");
            const addVideoResponse = await addVideo(body);

              if(addVideoResponse){
                console.log('Fireship has uploaded a new video!');
                await sendMessageToChannel("New video is out!");
                await sendMessageToChannel(body.videoURL);


              }
          }
          
        });

      
     
  }catch(error){
    console.log(`Error when checking for update: ${error}`);
  }
}

const getLatestEntry = async (): Promise<any> => {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })  
      .limit(1);  
  
    if (error) {
      console.error("Error fetching data:", error);
      return null;
    }
  
    return data ? data[0] : null;  
  }
    



const addVideo = async (body: Video): Promise<any> =>{
    
  try{
    const {data, error} = await supabase
    .from('videos')
    .insert(body);

    if(error){
      console.log(`Error when adding video to DB: ${error}`);
      return null;
    }

    return "success";

  } catch(error){
      console.log(`Got error when fetching from DB: ${error}`);
      return null;
    }

}

const sendMessageToChannel = (messageContent: string) => {
  const channel = client.channels.cache.get(DISCORD_CHANNEL_ID);
  if (channel) {
      (channel as TextChannel).send(messageContent);
  } else {
      console.error("Channel not found or isn't a text channel.");
  }
};

const getVideoRapid = async(): Promise<string | null> =>{
    
  try{
    const response = await axios.request(optionsRapid);
    console.log(response.data);
    return "true";
  }catch(error){
    console.log(`Error: ${error}`);
    return null;
  }
  
}