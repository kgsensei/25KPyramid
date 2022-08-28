// Code is Copyright (c) of kgsensei & Jeremy 2022.

// Define socket for websockets communication
const socket = io()

// Allow customized game categories in ctrl panel
allowCustomCats = false

// Keep track of current round for control panel
round = 0

// Define game data variable
fetch("/data/wordlist.json")
.then((response) => {return response.json()})
.then((data) => {
    gameData = data
    if(allowCustomCats) {
        roundCategoryNames(0)
    }
})

$(document).ready(() => {
    // Get lasted display information from server/ui
    socket.emit('adminEvent', {'action': 'reqInformation'})
})

function roundCategoryNames(rnd) {
    let index = 0
    let jsonArray = eval(`gameData.round${rnd}.categories`)
    for(let item in jsonArray) {
        index = index + 1
        $("#cat" + index).children().html(jsonArray[item])
    }
    $("#tb1").children().html(eval(`gameData.round${rnd}.tieBreakerNames`)[0])
    $("#tb2").children().html(eval(`gameData.round${rnd}.tieBreakerNames`)[1])
}

socket.on('consoleUpdate', (data) => {
    if(data.action == "update") {
        console.log(data)
        round = data.roundNumber
        if(allowCustomCats) {
            roundCategoryNames(round)
        }
        $('#teamOneScore').children().html(`Team 1: ${data.teamOne}`)
        $('#teamTwoScore').children().html(`Team 2: ${data.teamTwo}`)
    }
})

function actionAccepted() {
    $('#actionSentOverlay').fadeIn(150)
    $('#actionSentOverlay').fadeOut(150)
}

function sendCorrect() {
    actionAccepted()
    socket.emit('adminEvent', {'action': 'correct'})
}

function sendIncorrect() {
    actionAccepted()
    socket.emit('adminEvent', {'action': 'pass'})
}

function navCategory(catIndex) {
    actionAccepted()
    socket.emit('adminEvent', {'action': 'navigate', 'category': catIndex})
}

function quitCategory() {
    actionAccepted()
    if(window.confirm("This will quit the current category, are you sure?")) {
        socket.emit('adminEvent', {'action': 'quitCategory'})
    }
}

function newRound() {
    socket.emit('adminEvent', {'action': 'reqInformation'})
    if(window.confirm("This will erase this rounds information, are you sure?")) {
        round = round + 1
        actionAccepted()
        socket.emit('adminEvent', {'action': 'newRound'})
    }
}

function switchTeams() {
    actionAccepted()
    socket.emit('adminEvent', {'action': 'switchTeams'})
}

function forceReload() {
    actionAccepted()
    if(window.confirm("This will reset all game data, are you sure?")) {
        socket.emit('adminEvent', {'action': 'forceReload'})
    }
}

function useGameCats() {
    if(allowCustomCats) {
        allowCustomCats = false
        for(let i = 0; i < 7; i++) {
            $("#cat" + i).children().html("Category " + i)
        }
        $("#tb1").children().html("Tie Breaker Team 1")
        $("#tb2").children().html("Tie Breaker Team 2")
        $("#useGameCat").html("Use Game Categories")
    } else {
        allowCustomCats = true
        roundCategoryNames(round)
        $("#useGameCat").html("Use Default Categories")
    }
}

function tieBreaker(type) {
    actionAccepted()
    socket.emit('adminEvent', {'action': 'tieBreaker', 'team': type})
}

function showCats() {
    actionAccepted()
    socket.emit('adminEvent', {'action': 'showCats'})
}

function editScore(team, type) {
    actionAccepted()   
    socket.emit('adminEvent', {'action': 'editScore', "team": team, "type": type})
}
