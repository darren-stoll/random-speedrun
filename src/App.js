import React from 'react';
import './App.scss';
import axios from 'axios';

function App() {
  return (
    <div className="main">
      <RandomRunGenerator />
    </div>
  );
}

// Component for generating a random run from the speedrun.com API
const RandomRunGenerator = () => {
  // Hooks
  const [url, setUrl] = React.useState('');
  const [gameID, setGameID] = React.useState('');
  const [gameName, setGameName] = React.useState('');
  const [categoryID, setCategoryID] = React.useState('');
  const [categoryName, setCategoryName] = React.useState('');
  const [userID, setUserID] = React.useState('');
  const [userName, setUserName] = React.useState('');

  // gameReducer function that handles state and action
  const gameReducer = (state, action) => {
    switch (action.type) {
      case "GAME_FINDING": 
        return {
          ...state,
          isInit: true,
          isLoading: true,
          data: ''
        };
      case "GAME_DATA_SET":
        return {
          ...state,
          isLoading: true,
          data: action.payload
        }
      case "GAME_FOUND":
        return {
          ...state,
          isLoading: false,
        }
      default: 
        throw new Error();
    }
  }

  // useReducer hook that handles game and gamename states
  const [game, dispatchGame] = React.useReducer(
    gameReducer,
    { isInit: false, isLoading: false, data: '' }
  )
  
  // useEffect for handling the axios API retrieval for pressing the "Random" button
  React.useEffect(() => {
    // If url is set (the button is pushed), then do fetchData function
    if (url !== '') {
      // Config for the random game getter
      const configGame = {
        method: 'GET',
        url: url,
        headers: {
          Accept: 'application/json'
        }
      };
      const fetchGameData = async () => {
        try {
          // Retrieve the first API from the game section that gets the game ID
          let responseGame = await axios(configGame);
          // Set the game and gameName states to the randomly selected game, both ID and name
          setGameID(responseGame.data.data[0].id);
          console.log("running");
          setGameName(responseGame.data.data[0].names["twitch"]);
        } catch (err) {
          console.log(err);
        }
        
      }
      fetchGameData();
    }
  }, [url])

  // useEffect for handling the axios API retrieval for after the gameID is set in the fetchGameData function
  React.useEffect(() => {
    if (gameID !== '') {
      // Config that extracts the records for the game, account for up to 200 categories
      const configRecord = {
        method: 'GET',
        url: `https://www.speedrun.com/api/v1/games/${gameID}/records?max=200`,
        headers: {
          Accept: 'application/json'
        }
      };
      const fetchRecordData = async () => {  
        try {
          // Retrieve the second API from the games section that gets the records
          let responseRecord = await axios(configRecord);
          // Grab the number of categories and pick a random one to pull the record from
          let randCategoryNum = responseRecord.data.data.length;
          let randCategory = Math.floor(Math.random() * Math.floor(randCategoryNum));
          dispatchGame({ type: "GAME_DATA_SET", payload: responseRecord.data.data[randCategory] });
          console.log(responseRecord.data.data[randCategory].category);
          setCategoryID(responseRecord.data.data[randCategory].category);
          if (responseRecord.data.data[randCategory].runs.length !== 0) setUserID(responseRecord.data.data[randCategory].runs[0].run.players[0].id);
          else {
            setUserID('');
            setUserName('');
          }
          console.log(responseRecord.data.data[randCategory]);
        } catch (err) {
          console.log(err);
        }
        
      }
      fetchRecordData();
    }  
  }, [gameID])

  // useEffect for handling the axios API retrieval to get the category name
  React.useEffect(() => {
    if (categoryID !== '') {
      // Config that extracts the category info based on the ID
      const configCategory = {
        method: 'GET',
        url: `https://www.speedrun.com/api/v1/categories/${categoryID}`,
        headers: {
          Accept: 'application/json'
        }
      };
      const fetchCategoryData = async () => {   
        console.log(`https://www.speedrun.com/api/v1/categories/${categoryID}`);
        // Retrieve the third API from the categories section to get the category info based on the ID
        let responseCategory = await axios(configCategory);
        
        // Set the category name to the data retrieved from the ID
        setCategoryName(responseCategory.data.data.name);
        dispatchGame({ type: "GAME_FOUND" });
      }
      fetchCategoryData();
    }  
  }, [categoryID]);

  // useEffect for handling the axios API retrieval to get the category name
  React.useEffect(() => {
    if (userID !== '') {
      // Config that extracts the category info based on the ID
      const configUser = {
        method: 'GET',
        url: `https://www.speedrun.com/api/v1/users/${userID}`,
        headers: {
          Accept: 'application/json'
        }
      };
      const fetchUserData = async () => { 
        console.log(`https://www.speedrun.com/api/v1/users/${userID}`)
        // Retrieve the third API from the categories section to get the category info based on the ID
        let responseUser = await axios(configUser);
        
        // Set the category name to the data retrieved from the ID
        setUserName(responseUser.data.data.names.international);
      }
      fetchUserData();
    }  
  }, [userID]);

  // Function that activates when the submit button is pressed
  const randomNumber = (event) => {
    const RAND_GAME = Math.floor(Math.random() * Math.floor(19234));

    setUrl(`https://www.speedrun.com/api/v1/games?max=1&offset=${RAND_GAME}`);
    dispatchGame({ type: "GAME_FINDING" });

    event.preventDefault();
  }

  return (
    <>
      <div className="search">
        <form onSubmit={randomNumber}>
          <button type="submit" disabled={game.isLoading}>Random!</button>
        </form>
      </div>
      {game.isLoading
        ? <div className="info">Loading ...</div>
        : game.isInit 
        ? <div className="info"><RandomGameInfo gamename={gameName} data={game.data} category={categoryName} username={userName} /></div>
        : ""}
    </>
  )
}

// Component that returns the random game's info
const RandomGameInfo = ({ gamename, data, category, username }) => {
  
  // Function that returns the data if there is a record for the category
  const hasARun = () => {
    // Convert the time in the json to a readable format
    let timeD = data.runs[0].run.times.primary;
    let timeArray = timeD.match(/(\d+\.*\d*)(?=[HMS])/ig);
    timeArray = timeArray.reverse();
    let fullTime = "";
    // Loop through the time array to create a string in a readable time format
    for (let i = 0; i < 3; i++) {
      if (timeArray.length < i + 1) {
        if (i === 1) fullTime = ":00" + fullTime;
        else if (i === 2) fullTime = "0" + fullTime;
        else fullTime = ":00";
      } else {
        fullTime = timeArray[i] + fullTime;
        if (parseFloat(timeArray[i]) < 10.000 && i !== 2) fullTime = "0" + fullTime;
        if (i !== 2) fullTime = ":" + fullTime;
      }
    }

    return (
      <div>
        <p>Fastest known time, held by {username}</p>
        <p>Completed in <a href={data.runs[0].run.weblink} target="_blank" rel="noreferrer noopener">{fullTime}</a> on {data.runs[0].run.date}</p> 
        {/* CHECKPOINT - convert date to reader-friendly format + upload to netlify site */}
      </div>
    );
  }


  return (
    <>
      <a href={data.weblink} rel="noreferrer noopener" target="_blank">
        <h2>{gamename}</h2>
        <h3>{category}</h3>
      </a>
      {username === '' && data.runs.length === 0
        ? <div>This category doesn't have a current record. Go set one!</div> 
        : hasARun()
      }
    </>
  )
}

export default App;
