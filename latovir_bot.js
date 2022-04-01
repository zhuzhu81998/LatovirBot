//Load Node's native file system module.
const fs = require('fs');
//Load discord.js Module 
const Discord = require('discord.js');
//Load configuration 
const config = require('./config.json');
//Load Sequelize, an object-relational-mapper(ORM) for database usage
const Sequelize = require('sequelize');
const table = require('./commands/table.js');

//create Latovir Discord client 
const latovir = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS", "DIRECT_MESSAGES", "DIRECT_MESSAGE_REACTIONS"] });
latovir.login(config.token);
//create a extend JS's native Map class for better mapping of commands 
latovir.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

/*-----------------------------Database-----------------------------*/
//Init sqlite3 database 
const provincesdb = new Sequelize({
    dialect: 'sqlite',
    storage: './db/provinces.sqlite'
});
const armiesdb = new Sequelize({
    dialect: 'sqlite',
    storage: './db/armies.sqlite'
});
const factionsdb = new Sequelize({
    dialect: 'sqlite',
    storage: './db/factions.sqlite'
});
const gamedb = new Sequelize({
    dialect: 'sqlite',
    storage: './db/game.sqlite'
})
//Init sqlite3 local memory db
const memory = new Sequelize('sqlite::memory');

const armies = armiesdb.define('armies', table.rArmies());
const factions = factionsdb.define('factions', table.rFactions());
const provinces = provincesdb.define('provinces', table.rProvinces());


//Read fils from /commands folder
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    latovir.commands.set(command.name, command);
}

//db start and sync
const mtable = latovir.commands.get('table').rmember();
const mtalk = latovir.commands.get('table').rtalk();

(async () => {
    const table = await memory.define('member', mtable);
    await table.sync();

    const ttalk = await memory.define('talk', mtalk);
    await ttalk.sync();

    const armies = await armiesdb.define('armies', latovir.commands.get('table').rArmies());
    await armies.sync();

    const factions = await factionsdb.define('factions', latovir.commands.get('table').rFactions());
    await factions.sync();

    const provinces = await provincesdb.define('provinces', latovir.commands.get('table').rProvinces());
    await provinces.sync();

    const game = await gamedb.define('game', latovir.commands.get('table').rGame());
    await game.sync();

    /*const document = await sequelize.define('document', latovir.commands.get('table').rdocument());
    await document.sync();*/
})()
.then(() => {
     console.log('Successfully synced');
})
.catch(err => {
    console.error(err);
});

/*-----------------------------Startup-----------------------------*/
latovir.once('ready', () => {
    //Send hello message to all servers 
    const mservers = latovir.guilds.cache.map(guild => {
        return guild;
    });
    /*for (mguild of mservers) {
        if (mguild.systemChannel != undefined) {
            mguild.systemChannel.send(`Hi @everyone, the stupid Bot of Latovir (<@${latovir.user.id}>) is now available!`);
        }
    }*/
    //set activity bot
    latovir.user.setActivity('scientia');

    //hello message 
    console.log(`I am ${latovir.user.tag}`);
});
//send hellomessage to new servers 
latovir.on('guildCreate', guild => {
    if (guild.systemChannel != undefined) {
        guild.systemChannel.send(`Hi @everyone, I am the stupid Bot of Latovir, developing by <@594604652876660756>.\nSo please don't ask me anything to do.`);
    }
});
/*########_Main_Programm_#########*/
latovir.on('messageCreate', async message => {
    /*-----------------------------DirectReaction-----------------------------*/
    //check quiet 
    if (message.channel.type != 'dm') {
        const mcheck = latovir.commands.get('quiet');
        mcheck.check(message, message.author.id, memory);
    }

    /*-----------------------------dynamic_Prefix Commands-----------------------------*/

    if (!message.content.startsWith(config.prefix) || message.author.bot) return;
    //Trim prefix out of message content, removes the leading and trailing white space and line terminator characters from a string and put it into an array for optimisation
    const args = message.content.slice(config.prefix.length).trim().split(/~+/);
    const commandName = args.shift().toLowerCase();

    //simpler prefix for talk command
    if (commandName == '1') {
        latovir.commands.get('talk').check(message, args, memory.define('talk', latovir.commands.get('table').rtalk()), `$${commandName}`);
    }

    //Exit early if no command is used 
    if (!latovir.commands.has(commandName)) return;
    
   //find the requested command in the command 
    const command = latovir.commands.get(commandName);

    //Exit early if argument is used 
    if (command.arg && args.length == 0) {
        let reply = `You didn't provide any argument.`;
        if (command.usage) {
            reply += `\nThe proper usage would be ${config.prefix}${commandName}~${command.usage}`;
        }
        return message.reply(reply);
    }
    //check if command is server only 
    /*if (command.guildOnly && message.channel.type != 'text') {
        return message.reply(`${commandName} only available in a Server`);
    }*/
    //run the matching command 
    try {
        if (command.public == false) {
            return;
        }
        else {
            await command.execute(message, args, memory, provincesdb, factionsdb, armiesdb, gamedb);
        }
    }
    catch (error) {
        console.error(error);
        if(error.code != undefined){
            message.reply(`There was an Error: ${error.code}`);
        }
    }
});

/*
window.onload = function() {
    document.body.innerHTML = "<h1>Latovir!!</h1>" +
                            "<h2>List of Armies:</h2>" +
                            "<p id=\"list_armies\"></p>" +
                            "<h2>List of Provinces:</h2>" +
                            "<p id=\"list_provinces\"></p>" +
                            "<h2>List of Factions:</h2>" +
                            "<p id=\"list_factions\"></p>" +
                            "<input type=\"button\" id=\"refresh_list\" value=\"Refresh\"/>" +
                            "<input type=\"button\" id=\"login_button\" value=\"Log In\"/>";
    document.getElementById("refresh_list").onclick = function(){
        try {
            (async () => {
                let data_armies = `the list of armies:\nArmy ID - Faction ID - Army Level - Army Strength - Army Location ID\n`;
                const list_armies = await armies.findAll({})
                .catch(err => { 
                    data_armies = err;
                });
                for(let i = 0; list_armies[i] != undefined; i++){
                    data_armies += `${i+1}. **${list_armies[i].get('a_id')}** - ${list_armies[i].get('a_faction_id')} - ${list_armies[i].get('a_level')} - ${list_armies[i].get(`a_strength`)} - ${list_armies[i].get(`a_location_id`)}\n`;
                }
                return data_armies;
            })()
            .then(data_armies => {
                document.getElementById("list_armies").innerText = data_armies;
            });
            (async () => {
                let data_factions = `the list of factions:\nFaction ID - Player ID - Gold\n`;
                const list_factions = await factions.findAll({})
                .catch(err => { 
                    data_factions = err;
                });
                for(let i = 0; list_factions[i] != undefined; i++){
                    data_factions += `${i+1}. **${list_factions[i].get('f_id')}** - ${list_factions[i].get('f_name')} - <@${list_factions[i].get('f_player_discord')}> - ${list_factions[i].get('f_gold')}\n`;
                }
                return data_factions;
            })()
            .then(data_factions => {
                document.getElementById('list_factions').innerText = data_factions;
            });
            (async () => {
                let data_provinces = `the list of Provinces:\nProvince ID - Province Name - Province Level - Province Autonomity - Province Lord ID - Province Defender Mod - Province Income\n`;
                const list_provinces = await provinces.findAll({})
                .catch(err => { 
                    data_factions = err;
                });
                for(let i = 0; list_provinces[i] != undefined; i++){
                    data_provinces += `${i+1}. **${list_provinces[i].get('p_id')}** - ${list_provinces[i].get('p_name')} - ${list_provinces[i].get('p_level')} - ${list_provinces[i].get('p_autonom')} - ${list_provinces[i].get(`p_lord`)} - ${list_provinces[i].get(`p_army_modification`)} - ${list_provinces[i].get(`p_income`)}\n`;
                }
                return data_provinces;
            })()
            .then(data_provinces => {
                document.getElementById('list_provinces').innerText = data_provinces;
            });
        }
        catch(err) {
            console.error(err);
        }
    }
    document.getElementById("login_button").onclick = function(){
        //bot login
        latovir.login(config.token);
    }
}*/