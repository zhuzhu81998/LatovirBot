const Sequelize = require('sequelize');
const Discord = require('discord.js');
const config = require('./../config.json');
const table = require('./table.js');

const Op = Sequelize.Op;

module.exports = {
    id: 3,
    name: 'latovir',
    usage: '',
    arg: true,
    description: 'only for playing',
    bin_distri(){
        let X = 0;
        const n = 101;
        const p = 0.5;
        for(let i = 0; i < n; i++){
            const v = Math.floor(Math.random() * 10);
            if(v < 5){
                X++;
            }
        }
        return (X / n - p);
    },

    battle(message, attacker_army_id_array, defender_army_id_array, a_army_mod, p_army_modification, armies){
        let attacker_army_strength = 0;
        let attacker_number = 0;
        let attacker_basic_strength = 0;
        for(attacker_number = 0; attacker_army_id_array[attacker_number] != undefined; attacker_number++){
            attacker_army_strength += (attacker_army_id_array[attacker_number].get('a_strength') * (1 + Math.floor(attacker_army_id_array[attacker_number].get('a_level')) * 0.1));
            attacker_basic_strength += attacker_army_id_array[attacker_number].get('a_strength');
        }
        //console.log(attacker_basic_strength);
        let attacker_army_quota = new Array(attacker_number);
        for(let i = 0; attacker_army_id_array[i] != undefined; i++){
            attacker_army_quota[i] = attacker_army_id_array[i].get('a_strength') / attacker_army_strength;
        }
        let defender_number = 0;
        let defender_army_strength = 0;
        let defender_basic_strength = 0;
        for(defender_number = 0; defender_army_id_array[defender_number] != undefined; defender_number ++){
            defender_army_strength += (defender_army_id_array[defender_number].get('a_strength') * (1 + Math.floor(defender_army_id_array[defender_number].get('a_level')) * 0.1));
            defender_basic_strength += defender_army_id_array[defender_number].get('a_strength');
        }
        //console.log(defender_basic_strength);
        let defender_army_quota = new Array(defender_number);
        for(let i = 0; defender_army_id_array[i] != undefined; i++){
            defender_army_quota[i] = defender_army_id_array[i].get('a_strength') / defender_army_strength;
        }
        //Defender Advantages
        defender_army_strength += (defender_army_strength * p_army_modification);
        attacker_army_strength += (attacker_army_strength * a_army_mod);
        const sum_army_strength = attacker_army_strength + defender_army_strength;
        const sum_army_basic_strength = attacker_basic_strength + defender_basic_strength;
        //console.log(defender_army_strength);
        let victory_basic_prob = attacker_army_strength / (attacker_army_strength + defender_army_strength);
        if(attacker_army_strength > defender_army_strength){
            victory_basic_prob = 0.5 + Math.pow((0.5 * attacker_army_strength - 0.5 * defender_army_strength) / (sum_army_strength), 1.3);
        }
        else if(attacker_army_strength <= defender_army_strength){
            victory_basic_prob = 0.5 - Math.pow((0.5 * defender_army_strength - 0.5 * attacker_army_strength) / (sum_army_strength), 1.3);
        }
        let victory_var_prob = this.bin_distri();
        //console.log(victory_var_prob);
        const victory_real_prob = victory_basic_prob + victory_var_prob;
        const loss_variable = Math.random() / 2;
        let loss_ratio = victory_real_prob + 0.5;
        if(loss_ratio > 1.45) {
            loss_ratio = 1.45;
        }
        if(loss_ratio < 0.55) {
            loss_ratio = 0.55;
        }
        let attacker_loss = Math.round((sum_army_basic_strength * loss_variable) / (1 + loss_ratio));
        //attacker_loss -= (attacker_army_strength - attacker_basic_strength);
        //if(attacker_loss){

        //}
        const defender_loss = Math.round((loss_ratio * sum_army_basic_strength * loss_variable) / (1 + loss_ratio));
        if(victory_real_prob > 0.5){
            //attacker wins
            
            message.reply(`Attacker: ${attacker_army_strength}, ${defender_army_strength} Attacker Wins!, Attacker Loss: ${attacker_loss}, Defender Loss: ${defender_loss}`);
        }
        else if(victory_real_prob < 0.5) {
            //defender wins
            message.reply(`Attacker: ${attacker_army_strength}, ${defender_army_strength} Defender Wins!, Attacker Loss: ${attacker_loss}, Defender Loss: ${defender_loss}`);
        }
        else {
            //idk
        }
        (async () => {
            for(let i = 0; i < attacker_number; i++){
                const new_strength = Math.round(attacker_army_id_array[i].get('a_strength') - attacker_loss * attacker_army_quota[i]);
                const id = attacker_army_id_array[i].get('a_id');
                const new_level = attacker_army_id_array[i].get('a_level') + (defender_loss * attacker_army_quota[i]) / 1000;
                const result = await armies.update({ a_strength: new_strength, a_level: new_level }, { where: { a_id: id } });
                if(result > 1){
                    throw 'unique error';
                }
            }
            for(let i = 0; i < defender_number; i++){
                const new_strength = Math.round(defender_army_id_array[i].get('a_strength') - defender_loss * defender_army_quota[i]);
                const id = defender_army_id_array[i].get('a_id');
                const new_level = defender_army_id_array[i].get('a_level') + (attacker_loss * defender_army_quota[i]) / 1000;
                const result = await armies.update({ a_strength: new_strength, a_level: new_level }, { where: { a_id: id } });
                if(result > 1){
                    throw 'unique error';
                }
            }
        })();

        console.log(victory_basic_prob);
        console.log(victory_real_prob);
    },

    execute(message, args, memory, provincesdb, factionsdb, armiesdb, gamedb){
        const armies = armiesdb.define('armies', table.rArmies());
        
        const factions = factionsdb.define('factions', table.rFactions());
        
        const provinces = provincesdb.define('provinces', table.rProvinces());
        
        const game = gamedb.define('game', table.rGame());
    
        let data_provinces;
        const commandArg = args.shift().toLowerCase();
        switch(commandArg){
            case 'new':
                switch(args.shift().toLowerCase()){
                    case 'army':
                        try{
                            (async () => {
                                const newarmy = await armies.create({
                                    a_id: args[0],
                                    a_faction_id: args[1],
                                    a_level: [2],
                                    a_strength: args[3],
                                    a_location_id: args[4]
                                }).catch( err => { console.error(err); });
        
                                return newarmy;
                            })().then(result => {
                                if(result != undefined && result != null){
                                    message.react('👌')
                                    .catch(err => {
                                        console.error(err);
                                    });
                                }
                                else{
                                    message.reply(`something went wrong`);
                                }
                            })
                            .catch(err => {
                                console.error(err);
                            });
                        } catch(err){
                            console.error(err);
                        }
                        break;
                    
                    case 'faction':
                        try{
                            (async () => {
                                const newfaction = await factions.create({
                                    f_id: args[0],
                                    f_name: args[1],
                                    f_player_discord: args[2],
                                    f_gold: args[3]
                                }).catch( err => { console.error(err); });
        
                                return newfaction;
                            })().then(result => {
                                if(result != undefined && result != null){
                                    message.react('👌')
                                    .catch(err => {
                                        console.error(err);
                                    });
                                }
                                else{
                                    message.reply(`something went wrong`);
                                }
                            })
                            .catch(err => {
                                console.error(err);
                            });
                        } catch(err){
                            console.error(err);
                        }
                        break;
    
                    case 'province':
                        try{
                            (async () => {
                                const newprovince = await provinces.create({
                                    p_id: args[0],
                                    p_name: args[1],
                                    p_level: args[2],
                                    p_autonom: args[3],
                                    p_lord: args[4],
                                    p_army_modification: args[5],
                                    p_income: args[6]
                                }).catch( err => { console.error(err); });
        
                                return newprovince;
                            })().then(result => {
                                if(result != undefined && result != null){
                                    message.react('👌')
                                    .catch(err => {
                                        console.error(err);
                                    });
                                }
                                else{
                                    message.reply(`something went wrong`);
                                }
                            })
                            .catch(err => {
                                console.error(err);
                            });
                        } catch(err){
                            console.error(err);
                        }
                        break;
                }
                break;
            
            case 'delete':
                switch(args.shift().toLowerCase()){
                    case 'army':
                        const army_id = args.shift().toLowerCase();
                        (async () => {
                            const res = await armies.destroy({ where: { a_id:  army_id} });
                            return res;
                        })()
                        .then(res => {
                            message.react('👌');
                        });
                        break;
                    case 'province':
                        const province_id = args.shift().toLowerCase();
                        (async () => {
                            const res = await provinces.destroy({ where: { p_id:  province_id} });
                            return res;
                        })()
                        .then(res => {
                            message.react('👌');
                        });
                }
                break;
            
            case 'move':
                (async () => {
                    const result = await armies.update({ a_location_id: args[1] }, { where: { a_id: args[0] } });
                    if(result > 1){
                        throw 'unique error';
                    }
                    return result;
                })().then(result => {
                    if(result != undefined && result != null){
                        message.react('👌')
                        .catch(err => {
                            console.error(err);
                        });
                    }
                    else{
                        message.reply(`something went wrong`);
                    }
                })
                .catch(err => {
                    message.reply(`something went wrong`);
                    console.error(err);
                });
                break;
            
            case 'list_armies':
                let data = `the list of armies:\nArmy ID - Faction ID - Army Level - Army Strength - Army Location ID\n`;
                try {
                    (async () => {
                        const list_armies = await armies.findAll({})
                        .catch(err => { 
                            message.reply(`something went wrong`);
                            console.error(err);
                        });
                        for(let i = 0; list_armies[i] != undefined; i++){
                            data += `${i+1}. **${list_armies[i].get('a_id')}** - ${list_armies[i].get('a_faction_id')} - ${list_armies[i].get('a_level')} - ${list_armies[i].get(`a_strength`)} - ${list_armies[i].get(`a_location_id`)}\n`;
                        }
                        const i_armies_data = Math.ceil(data.length / 2000);
                        let data_split_armies = new Array(i_armies_data);
                        for(let i = 0; i < i_armies_data; i++){
                            data_split_armies[i] = data.substring(i * 2000, (i + 1) * 2000);
                            message.reply(data_split_armies[i]);
                        }
                    })();
                }
                catch(err) {
                    message.reply(`something went wrong`);
                    console.error(err);
                }
                break;

            case 'list_factions':
                let data2 = `the list of factions:\nFaction ID - Player ID - Gold\n`;
                try {
                    (async () => {
                        const list_factions = await factions.findAll({})
                        .catch(err => { 
                            message.reply(`something went wrong`);
                            console.error(err);
                        });
                        for(let i = 0; list_factions[i] != undefined; i++){
                            data2 += `${i+1}. **${list_factions[i].get('f_id')}** - ${list_factions[i].get('f_name')} - <@${list_factions[i].get('f_player_discord')}> - ${list_factions[i].get('f_gold')}\n`;
                        }
                        message.reply(data2, { split: true });
                    })();
                }
                catch(err) {
                    message.reply(`something went wrong`);
                    console.error(err);
                }
                break;

            case 'upgrade_army':
                (async () => {
                    const result = await armies.update({ 
                        a_faction_id: args[1],
                        a_level: args[2],
                        a_strength: args[3],
                        a_location_id: args[4] }, { where: { a_id: args[0] } });
                    if(result > 1){
                        throw 'unique error';
                    }
                    return result;
                })().then(result => {
                    if(result != undefined && result != null){
                        message.react('👌')
                        .catch(err => {
                            console.error(err);
                        });
                    }
                    else{
                        message.reply(`something went wrong`);
                    }
                })
                .catch(err => {
                    message.reply(`something went wrong`);
                    console.error(err);
                });
                break;

            case 'battle':
                const a_army_mod = args.shift().toLowerCase();
                const p_army_modification = args.shift().toLowerCase();
                const attacker_number = args.shift().toLowerCase();
                let attacker_army_id_array = new Array(attacker_number);
                let cur_a_id;
                (async () => {
                    for(let i = 0; i < attacker_number; i++){
                        cur_a_id = args.shift().toLowerCase();
                        const res = await armies.findAll({ where: { a_id:  cur_a_id} });
                        attacker_army_id_array[i] = res[0];
                    }
                })()
                .then( () => {
                    (async () => {
                        const defender_number = args.shift().toLowerCase();
                        let defender_army_id_array = new Array(defender_number);
                        for(let i = 0; i < defender_number; i++){
                            cur_a_id = args.shift().toLowerCase();
                            const res = await armies.findAll({ where: { a_id:  cur_a_id} });
                            defender_army_id_array[i] = res[0];
                        }
                        return defender_army_id_array;
                    })()
                    .then( defender_army_id_array => {
                        this.battle(message, attacker_army_id_array, defender_army_id_array, a_army_mod, p_army_modification, armies);
                    });
                });
                break;
                
            case 'new_round':
                try {
                    (async () => {
                        const list_factions = await factions.findAll({})
                        .catch(err => { 
                            message.reply(`something went wrong`);
                            console.error(err);
                        });
                        return list_factions;
                    })()
                    .then(list_factions => {
                        for(let i = 0; list_factions[i] != undefined; i++){
                            let f_money = 0;
                            const cur_f_id = list_factions[i].get('f_id');
                            (async () => {
                                const f_provinces = await provinces.findAll({ where: { p_lord: cur_f_id } });
                                for(let j = 0; f_provinces[j] != undefined; j++){
                                    if(f_provinces[j].get('p_income') == -1){
                                        const other_provinces = await provinces.findAll({
                                            where: {
                                                p_lord: {
                                                    [Op.ne]: cur_f_id
                                                }
                                            }
                                        });
                                        let income_oth_prov = 0;
                                        for(let k = 0; other_provinces[k] != undefined; k++){
                                            income_oth_prov += other_provinces[k].get('p_income');
                                        }
                                        f_money += (income_oth_prov / 11) * (1 + f_provinces[j].get('p_level') * 0.1) * 0.5;
                                    }
                                    else{
                                        if(f_provinces[j].get('p_autonom') == 1){
                                            f_money += f_provinces[j].get('p_income') * (1 + f_provinces[j].get('p_level') * 0.1) * 0.2;
                                        }
                                        else{
                                            f_money += f_provinces[j].get('p_income') * (1 + f_provinces[j].get('p_level') * 0.1);
                                        }
                                    }
                                }
                                const result = await factions.update({ f_gold: f_money }, { where: { f_id: cur_f_id } });
                                return result;
                            })()
                            .then(result => {
                                if(result != undefined && result != null){
                                    message.react('👌')
                                    .catch(err => {
                                        console.error(err);
                                    });
                                }
                                else{
                                    message.reply(`something went wrong`);
                                }
                            });
                        }
                    });
                }
                catch(err) {
                    message.reply(`something went wrong`);
                    console.error(err);
                }
                break;
            
            case 'set_money':
                (async () => {
                    const result = await factions.update({ 
                        f_gold: args[1] }, { where: { f_id: args[0] } });
                    if(result > 1){
                        throw 'unique error';
                    }
                    return result;
                })().then(result => {
                    if(result != undefined && result != null){
                        message.react('👌')
                        .catch(err => {
                            console.error(err);
                        });
                    }
                    else{
                        message.reply(`something went wrong`);
                    }
                })
                .catch(err => {
                    message.reply(`something went wrong`);
                    console.error(err);
                });
                break;
            
            case 'update_province':
                (async () => {
                    const result = await provinces.update({ 
                        p_name: args[1],
                        p_level: args[2],
                        p_autonom: args[3],
                        p_lord: args[4],
                        p_army_modification: args[5],
                        p_income: args[6] }, { where: { p_id: args[0] } });
                    if(result != 1){
                        throw 'unique error';
                    }
                    return result;
                })().then(result => {
                    if(result != undefined && result != null){
                        message.react('👌')
                        .catch(err => {
                            console.error(err);
                        });
                    }
                    else{
                        message.reply(`something went wrong`);
                    }
                })
                .catch(err => {
                    message.reply(`something went wrong`);
                    console.error(err);
                });
                break;

            case 'list_provinces':
                data_provinces = `the list of Provinces:\nProvince ID - Province Name - Province Level - Province Autonomity - Province Lord ID - Province Defender Mod - Province Income\n`;
                try {
                    (async () => {
                        const list_provinces = await provinces.findAll({})
                        .catch(err => { 
                            message.reply(`something went wrong`);
                            console.error(err);
                        });
                        for(let i = 0; list_provinces[i] != undefined; i++){
                            data_provinces += `${i+1}. **${list_provinces[i].get('p_id')}** - ${list_provinces[i].get('p_name')} - ${list_provinces[i].get('p_level')} - ${list_provinces[i].get('p_autonom')} - ${list_provinces[i].get(`p_lord`)} - ${list_provinces[i].get(`p_army_modification`)} - ${list_provinces[i].get(`p_income`)}\n`;
                        }
                        const i_provinces_data = Math.ceil(data_provinces.length / 2000);
                        let data_split_provinces = new Array(i_provinces_data);
                        for(let i = 0; i < i_provinces_data; i++){
                            data_split_provinces[i] = data_provinces.substring(i * 2000, (i + 1) * 2000);
                            message.reply(data_split_provinces[i]);
                        }
                    })();
                }
                catch(err) {
                    message.reply(`something went wrong`);
                    console.error(err);
                }
                break;

            case 'list_prov_land':
                data_provinces = `the list of Provinces:\nProvince ID - Province Name - Province Level - Province Autonomity - Province Lord ID - Province Defender Mod - Province Income\n`;
                try {
                    (async () => {
                        const list_provinces = await provinces.findAll({ where : { p_lord: args[0] }})
                        .catch(err => { 
                            message.reply(`something went wrong`);
                            console.error(err);
                        });
                        for(let i = 0; list_provinces[i] != undefined; i++){
                            data_provinces += `${i+1}. **${list_provinces[i].get('p_id')}** - ${list_provinces[i].get('p_name')} - ${list_provinces[i].get('p_level')} - ${list_provinces[i].get('p_autonom')} - ${list_provinces[i].get(`p_lord`)} - ${list_provinces[i].get(`p_army_modification`)} - ${list_provinces[i].get(`p_income`)}\n`;
                        }
                        const i_provinces_data = Math.ceil(data_provinces.length / 2000);
                        let data_split_provinces = new Array(i_provinces_data);
                        for(let i = 0; i < i_provinces_data; i++){
                            data_split_provinces[i] = data_provinces.substring(i * 2000, (i + 1) * 2000);
                            message.reply(data_split_provinces[i]);
                        }
                    })();
                }
                catch(err) {
                    message.reply(`something went wrong`);
                    console.error(err);
                }
                break;
            default:
                message.reply(`no such command!`);
                break;
        }
    }
}