const Sequelize = require('sequelize');
const table = require('./commands/table.js');


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

const armies = armiesdb.define('armies', table.rArmies());
const factions = factionsdb.define('factions', table.rFactions());
const provinces = provincesdb.define('provinces', table.rProvinces());


window.onload = function() {
    document.body.innerHTML = "<h1>Latovir!!</h1>" +
                            "<h2>List of Armies:</h2>" +
                            "<p id=\"list_armies\"></p>" +
                            "<h2>List of Provinces:</h2>" +
                            "<p id=\"list_provinces\"></p>" +
                            "<h2>List of Factions:</h2>" +
                            "<p id=\"list_factions\"></p>" +
                            "<input type=\"button\" id=\"refresh_list\" value=\"Refresh\"/>"
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
}