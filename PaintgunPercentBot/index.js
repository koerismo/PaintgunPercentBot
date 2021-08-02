/*Index.js - Controls bot functions */

// Load libraries

require('dotenv').config({ path: './environ.env' })
const discord = require('discord.js')
require('discord-reply');
const fs = require('fs')
const gen = require('./image_gen.js')

// Initialize vars

const client = new discord.Client();
var chapters = JSON.parse(fs.readFileSync('./live_data/data.json'))
const botPrefix = '//'

function saveDataToJSON() {
	fs.writeFile('./live_data/data.json',JSON.stringify(chapters),(err)=>{
		if (err) { return console.log(err) }
		console.log('Wrote changes to file.')
	})
}

// Write to image test

/*
chapters.forEach((x,y)=>{
	const out = fs.createWriteStream(`./chapter0${y}.png`)
	gen.drawStatImage(x,2).createPNGStream().pipe(out)
})
*/

function limitStringLength(st,maxlen=30) {return st.length>maxlen?st.slice(0,maxlen )+'...':st}

client.on('ready', () => {
	client.user.setPresence({ activity: { type: 'WATCHING', name: 'for //help' }, status: 'idle' })
	console.log(`Initialized account ${client.user.tag}`);
});

client.on('message', msg => {
	if (!msg.guild) return;

	// Bot channel check. Not using it since I am a little bit stupid.

	/*function guildHasBotChannel(guild) {
		return guild.channels.cache.filter(x => {return x.name.match(/bot/g) != null}).length > 0
	}

	if (!msg.channel.name.toLowerCase().includes(/(^(bot)[-_])|(^.*?[-_](bot))/g) && guildHasBotChannel(msg.guild)) {return;}*/

	/* HELP COMMAND */
	if (msg.content === botPrefix+'help') {
		msg.lineReply({
			"content": null,
			"embed": new discord.MessageEmbed({
				"title": "PaintgunPercent Help",
				"color": 15101225,
				"fields": [{
					"name": "//help",
					"value": "```Display this embed.```"
				},
				{
					"name": "//read <term>",
					"value": "```\nDisplay the first chapter that contains any levels that contain the search term. Highlights any matching levels.\n\nUsage:\n//read sp_a1\n//read intro2```"
				},
				{
					"name": "//write <term> <portals> <time (HH:MM:SS)>",
					"value": "```\nWrites a new top score to an entry after being approved by an administrator. The search term must only match one level.\n\nUsage:\n//write sp_a1_intro1 10 00:06:35\n//write jump_intro 8 00:11:21\n( The numbers in these examples are not reflective of actual runs. )\n```"
				}]
			})
		})
	}

	/* TEST COMMAND */

	/*if (msg.content === botPrefix+'test') {
		msg.lineReply({
			'files': [gen.drawStatImage(chapters[0],1,['sp_a3_jump_intro']).toBuffer()]
		})
	}*/

	/* READ COMMAND */

	if (msg.content.startsWith(botPrefix+'read')) {
		const parsed = msg.content.split(' ')

		// Error case #1: No search term provided.
		if (parsed.length < 2) {return msg.lineReply('You must provide a search term!')}

		function filterLevels(chapter) { return chapter.levels.filter(x => {return x.name.includes(parsed[1])}) }

		// Create list of chapters that contain levels that match the search term.
		const chapterCandidates = chapters.filter(x => { return filterLevels(x).length > 0 })

		// Error case #2: No matches.
		if (chapterCandidates.length < 1) {return msg.lineReply('No levels were found containing that name!')}

		// Create a list of all levels that match the search term. Super messy, but it works fine.
		let levelCandidates = filterLevels(chapterCandidates[0]).map(y => {return y.name})

		// If all levels are to be highlighted, reset.
		if (levelCandidates.length == chapterCandidates[0].levels.length) { levelCandidates = []; }

		// Reply to message with generated image.
		msg.lineReply({
			'files': [ gen.drawStatImage(chapterCandidates[0],1,levelCandidates).toBuffer() ]
		})
	}

	/* WRITE COMMAND */

	if (msg.content.startsWith(botPrefix+'write')) {

		// Converts time to seconds, returns null if invalid
		function convertTime(s) {
			const res = s.match(/^(\d{2}):([0-5][0-9]):([0-5][0-9])/)
			if (res == null || res[0] != s) {return null}
			return Number(res[1])*3600 + Number(res[2])*60 + Number(res[3])
		}

		const parsed = msg.content.split(' ')
		if (parsed.length < 4)			{return msg.lineReply('You must provide a search term, a number of portals, and a time (HH:MM:SS)!')}

		const timeConverted = convertTime(parsed[3])

		if (isNaN(Number(parsed[2])))	{return msg.lineReply('Argument 2 must be a number! (Portals)')}
		if (parsed[3] === 'HH:MM:SS')	{return msg.lineReply('User must not be literal!')}
		if (timeConverted === null)		{return msg.lineReply('Argument 3 must be HH:MM:SS! (Time)')}

		function filterLevels(chapter) { return chapter.levels.map((x,y)=>{ return {data:x,index:y} }).filter(x => {return x.data.name.includes(parsed[1])}) }

		// Handle chapter/level search and error cases
		const chapterCandidates = chapters.map((x,y) => { return {data:x,index:y} }).filter(chapter => {return filterLevels(chapter.data).length > 0})
		if (chapterCandidates.length < 1) {return msg.lineReply('No levels were found containing that name!')}
		let levelCandidates = filterLevels(chapterCandidates[0].data)
		if (levelCandidates.length != 1) {return msg.lineReply('Search term too broad! Term must only match one map.')}

		// Ensure the proposed scores are higher than -1
		if (Number(parsed[2]) < 0 || timeConverted < 0) { return msg.lineReply('Portals/time must both be above 0!') }
		if (Number(parsed[2]) > 255) { return msg.lineReply('Maxiumum number of portals is 255!') }

		// Make sure the score is higher than the existing one
		function portalBestScorePriority(oldP,oldT,newP,newT) { return ((newP < oldP) || (newP == oldP && newT < oldT)) }
		const levelCandidateStats = levelCandidates[0].data
		if (!portalBestScorePriority(levelCandidateStats.best_portals, levelCandidateStats.best_time, Number(parsed[2]), timeConverted) && levelCandidateStats.best_time != 0) {
			return msg.lineReply('An existing entry with a lower portal count exists! The entry will not be overwritten.')
		}

		// Send response embed indicating no errors
		msg.lineReply({
			embed: new discord.MessageEmbed({
				"title": "PaintgunPercent Write Confirmation",
				"description": `You are overwriting the current top score for: \`${levelCandidates[0].data.name}\`\n\nThe new scores will be changed to:`,
				"color": 15101225,
				"fields": [
					{
						"name": "Portals",
						"value": parsed[2],
						"inline": true
					},
					{
						"name": "Time",
						"value": parsed[3],
						"inline": true
					},
					{
						"name": "An admin must react to this message to confirm the legitimacy of your run.",
						"value": "The run has a maximum of 1 hour before it expires, and an administrator must approve it within this period for it to be recorded."
					}
				]
			})
		})

		// Begin waiting for reactions. This isn't the prettiest method, but it works.
		.then(replyMessage=>{
			replyMessage.react('✅')
			replyMessage.awaitReactions((reaction,user) => {return (reaction.emoji.name === '✅' && !user.bot && replyMessage.guild.member(user).hasPermission('MANAGE_MESSAGES'))}, { time: 1000*60*60, max: 1 })
				.then(collected => {
					if (collected.size < 1) {
						return replyMessage.edit({
							embed: new discord.MessageEmbed({
								"title": "Write Request Expired",
								"description": "Your run submission has expired, as no administrators approved it within the time limit.",
								"color": 15083817
							})
						})
					}
					replyMessage.edit({
						embed: new discord.MessageEmbed({
							"title": "Write Request Accepted",
							"description": `Your run submission was accepted by ${collected.first().users.cache.last()}`,
							"color": 2745957
						})
					})
					chapters[chapterCandidates[0].index].levels[levelCandidates[0].index].best_time = timeConverted
					chapters[chapterCandidates[0].index].levels[levelCandidates[0].index].best_portals = Number(parsed[2])
					chapters[chapterCandidates[0].index].levels[levelCandidates[0].index].top_runner = limitStringLength(msg.author.tag.slice(0,-5))+msg.author.tag.slice(-5)
					saveDataToJSON()
					console.log(`Wrote score ${parsed[2]}/${parsed[3]} to ${levelCandidates[0].data.name} in #${chapterCandidates[0].index}-${levelCandidates[0].index}`)

				})
				.catch(console.error)
		})
	}
});

client.login(process.env.DISCORD_TOKEN);