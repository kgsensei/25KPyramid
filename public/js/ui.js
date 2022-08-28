// Code is Copyright (c) of kgsensei & Jeremy 2022.

// Define socket.io connection
const socket = io()

// Define game data variables (word list, category names, etc.)
fetch("/data/wordlist.json")
.then((response) => {return response.json()})
.then((data) => {
    gameData = data
    roundCategoryNames(null)
})

// Define team one variables
function teamOne(){}
teamOne.score = 0

// Define team two variables
function teamTwo(){}
teamTwo.score = 0

// Define game variables
flashAnimTime          = 250
isTieBreakerRunning    = false
doCorrectPassAnimation = true
lastOpenedCat          = null
pointsPerCorrect       = 1
numberOfWordsPerCat    = 7
teamTurn               = 1
currentCategory        = null
categoryFinishedOnZero = numberOfWordsPerCat
round                  = 0
wordIndex              = 0

// Send new information to admin control panel if required
function updateCtrl() {
    socket.emit('uiAction', {'action': 'update', 'roundNumber': round, 'teamOne': teamOne.score, 'teamTwo': teamTwo.score})
}

updateCtrl()

function roundCategoryNames(rnd) {
    let index = 0
    if(rnd != null) {
        let jsonArray = eval(`gameData.round${rnd}.categories`)
        for(let item in jsonArray) {
            index = index + 1
            $("#cat" + index).children().html(jsonArray[item])
            $("#cat" + index).children().fadeIn(200)
        }
    } else {
        for(let i = 0; i < 7; i++) {
            index = index + 1
            $("#cat" + index).children().fadeOut(200, () => {
                $("#cat" + index).children().html("")
            })
        }
    }
}

socket.on('serverEvent', (data) => {
    // Navigate to the category defined in the socket message
    if(data.action == 'navigate') {
        openCategory(data.category)
        currentCategory = data.category
        wordIndex = -1
        newWord()
    }
    // Do logic to see who gets points and whos turn it is
    if(data.action == 'correct') {
		if(doCorrectPassAnimation) {
			$('#correctFlash').fadeIn(flashAnimTime)
			$('#correctFlash').fadeOut(flashAnimTime)
		}
        categoryFinishedOnZero = categoryFinishedOnZero - 1
        newWord()
        if(teamTurn == 1) {
            teamOne.score = teamOne.score + pointsPerCorrect
        } else {
            teamTwo.score = teamTwo.score + pointsPerCorrect
        }
        updateCtrl()
        updateScoreDisplay()
    }
    // Quit the current category if it was entered by mistake or something
    if(data.action == 'quitCategory') {
        categoryFinishedOnZero = numberOfWordsPerCat
        if(lastOpenedCat != null) {
            $('#cat' + lastOpenedCat).children().css("opacity", "1")
            $('#wordPrompt').fadeOut(250)
        }
        if(isTieBreakerRunning) {
            isTieBreakerRunning = false
            $('#tieBreakerBG').animate({"opacity": "0"}, 250)
        }
    }
    // Pass the current question/word
    if(data.action == 'pass') {
        updateCtrl()
		if(doCorrectPassAnimation) {
			$('#passFlash').fadeIn(flashAnimTime)
    		$('#passFlash').fadeOut(flashAnimTime)
		}
        categoryFinishedOnZero = categoryFinishedOnZero - 1
        newWord()
    }
    // Pass the current question/word
    if(data.action == 'switchTeams') {
        switchTeams()
    }
    // Force reload the page in case of an error
    if(data.action == "forceReload") {
        window.location.reload()
    }
    // Run logic for the new round
    if(data.action == 'newRound') {
        for(let i = 0; i < 7; i++) {
            $('#cat' + i).children().css("opacity", "1")
        }
        $('#wordPrompt').fadeOut(250)
        lastOpenedCat = null
        teamTurn = 1
        currentCategory = null
        categoryFinishedOnZero = numberOfWordsPerCat
        round = round + 1
        roundCategoryNames(null)
        teamTwo.score = 0
        teamOne.score = 0
        $('#teamTwoScore').css({"font-size": "4vh", "opacity": "0.6"})
        $('#teamOneScore').css({"font-size": "5.5vh", "opacity": "1"})
        updateScoreDisplay()
        updateCtrl()
    }
    // Check if admin control panel needs new information from ui
    if(data.action == "reqInformation") {
        updateCtrl()
    }
    // Check if the control panel send a message saying a tie breaker must happen
    if(data.action == "tieBreaker") {
        isTieBreakerRunning = true
        numberOfWordsPerCat = numberOfWordsPerCat
        wordIndex = 0
        if(data.team != teamTurn) {
            switchTeams()
        }
        $("#tieBreakerBG").css({"top": "25%", "height": "50%", "opacity": "0"})
        $("#tieBreakerText").css("font-size", "7.5vw")
        $("#tieBreakerText").html(`TIE BREAKER: TEAM ${data.team}`)
        $("#tieBreakerBG").animate({"height": "100%", "top": "0%", "opacity": "1"}, 850)
        $("#tieBreakerText").delay(750).animate({"font-size": "2.5vw", "opacity": "0"}, 400, () => {
            $("#tieBreakerText").html(eval(`gameData.round${round}.tieBreaker${teamTurn}`)[0])
            $("#tieBreakerText").animate({"font-size": "5vw", "opacity": "1"}, 150)
        })
    }
    // Show the categories
    if(data.action == "showCats") {
        roundCategoryNames(round)
    }
    // Change the score of each team bc people
    if(data.action == "editScore") {
        editScore(data.team, data.type)
    }
    // Check to see if the turn has ended
    if(categoryFinishedOnZero == 0) {
        $('#wordPrompt').fadeOut(250)
        if(isTieBreakerRunning) {
            isTieBreakerRunning = false
            $('#tieBreakerBG').animate({"opacity": "0"}, 250)
        }
        lastOpenedCat = null
        categoryFinishedOnZero = numberOfWordsPerCat
        if(teamTurn == 1) {
            teamTurn = 2
            $('#teamTwoScore').animate({"font-size": "5.5vh", "opacity": "1"}, 250)
            $('#teamOneScore').animate({"font-size": "4vh", "opacity": "0.6"}, 250)
        } else {
            $('#teamTwoScore').animate({"font-size": "4vh", "opacity": "0.6"}, 250)
            $('#teamOneScore').animate({"font-size": "5.5vh", "opacity": "1"}, 250)
            teamTurn = 1
        }
    }
})

function newWord() {
    if(isTieBreakerRunning) {
        wordIndex = wordIndex + 1
        $("#tieBreakerText").html(eval(`gameData.round${round}.tieBreaker${teamTurn}`)[wordIndex])
    } else {
        if(currentCategory != null) {
            wordIndex = wordIndex + 1
            $("#wordToGuess").html(eval(`gameData.round${round}.cat${currentCategory}wrds`)[wordIndex])
        }
    }
}

function openCategory(catIndex) {
    lastOpenedCat = catIndex
    $('#cat' + catIndex).children().animate({"opacity": "0.5"}, 250)
    $('#wordPrompt').delay(200).fadeIn(250)
}

function switchTeams() {
    if(teamTurn == 1) {
        teamTurn = 2
        $('#teamTwoScore').animate({"font-size": "5.5vh", "opacity": "1"}, 250)
        $('#teamOneScore').animate({"font-size": "4vh", "opacity": "0.6"}, 250)
    } else {
        $('#teamTwoScore').animate({"font-size": "4vh", "opacity": "0.6"}, 250)
        $('#teamOneScore').animate({"font-size": "5.5vh", "opacity": "1"}, 250)
        teamTurn = 1
    }
}

function updateScoreDisplay() {
    $('#teamOneScore').html("Team 1: " + teamOne.score)
    $('#teamTwoScore').html("Team 2: " + teamTwo.score)
}

function editScore(team, type) {
    if(type == 'plus') {
        if(team == 1) {
            teamOne.score = teamOne.score + pointsPerCorrect
        }
        if(team == 2) {
            teamTwo.score = teamTwo.score + pointsPerCorrect
        }
    } else {
        if(team == 1) {
            teamOne.score = teamOne.score - pointsPerCorrect
        }
        if(team == 2) {
            teamTwo.score = teamTwo.score - pointsPerCorrect
        }
    }
    updateScoreDisplay()
    updateCtrl()
}
