const { ActivityType, Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const chalk = require("chalk");
const fs = require("fs");

// ─── Logger ───────────────────────────────────────────────────────────────────

const log = {
    _fmt: (label, color, msg) => {
        const time = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        console.log(`${chalk.gray(time)}  ${color(` ${label} `)}  ${chalk.white(msg)}`);
    },
    info:    (msg) => log._fmt("INFO",    chalk.bgBlue.bold,        msg),
    success: (msg) => log._fmt("OK",      chalk.bgGreen.black.bold, msg),
    warn:    (msg) => log._fmt("WARN",    chalk.bgYellow.black.bold, msg),
    error:   (msg) => log._fmt("ERR",     chalk.bgRed.bold,         msg),
    event:   (msg) => log._fmt("EVENT",   chalk.bgMagenta.bold,     msg),
    cmd:     (msg) => log._fmt("CMD",     chalk.bgCyan.black.bold,  msg),
};

// ─── Client ───────────────────────────────────────────────────────────────────

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildExpressions, GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks, GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping, GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions, GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.GuildScheduledEvents, GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [
        Partials.Channel, Partials.GuildMember, Partials.GuildScheduledEvent,
        Partials.Message, Partials.Reaction, Partials.ThreadMember, Partials.User,
    ],
    restTimeOffset: 0,
    failIfNotExists: false,
    presence: {
        activities: [{ name: "Un statut hyper cool !", type: ActivityType.Streaming, url: "https://www.twitch.tv/niridya" }],
        status: "online"
    },
    allowedMentions: { parse: ["roles", "users", "everyone"], repliedUser: false }
});

// ─── Config ───────────────────────────────────────────────────────────────────

client.config  = require("./config.json");
client.shadow  = require("./shadow.json");

// ─── Events ───────────────────────────────────────────────────────────────────

const eventFiles = fs.readdirSync("./events").filter(f => f.endsWith(".js"));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    const method = event.once ? "once" : "on";
    client[method](event.name, (...args) => event.execute(client, ...args));
    log.event(`Loaded → ${file}`);
}

// ─── Commands ─────────────────────────────────────────────────────────────────

client.commands = new Collection();
const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
    log.cmd(`Loaded → ${command.name}`);
}

// ─── Errors ───────────────────────────────────────────────────────────────────

async function errorHandler(error) {
    if (error.code === 10062 || error.code === 40060) return;
    log.error(error?.message ?? error);
}

process.on("unhandledRejection", errorHandler);
process.on("uncaughtException",  errorHandler);

// ─── Login ────────────────────────────────────────────────────────────────────

client.login(client.shadow.token).then(() => {
    log.success(`Connecté en tant que ${client.user?.tag}`);
});
