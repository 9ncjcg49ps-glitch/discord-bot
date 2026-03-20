import {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { afkUsers } from "./commands/afk.js";

interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

const token = process.env["DISCORD_TOKEN"];
if (!token) {
  throw new Error("DISCORD_TOKEN environment variable is required");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const commands = new Collection<string, Command>();

async function loadCommands() {
  const { data: pingData, execute: pingExecute } = await import(
    "./commands/ping.js"
  );
  const { data: echoData, execute: echoExecute } = await import(
    "./commands/echo.js"
  );
  const { data: helpData, execute: helpExecute } = await import(
    "./commands/help.js"
  );
  const { data: afkData, execute: afkExecute } = await import(
    "./commands/afk.js"
  );

  commands.set(pingData.name, { data: pingData, execute: pingExecute });
  commands.set(echoData.name, { data: echoData, execute: echoExecute });
  commands.set(helpData.name, { data: helpData, execute: helpExecute });
  commands.set(afkData.name, { data: afkData, execute: afkExecute });
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
  console.log(`Serving ${readyClient.guilds.cache.size} server(s)`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) {
    console.error(`No command found for: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing /${interaction.commandName}:`, error);
    const msg = {
      content: "Something went wrong running that command.",
      ephemeral: true,
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(msg);
    } else {
      await interaction.reply(msg);
    }
  }
});

    // 🔥 TARUH DI SINI (SEBELUM load & login)
    client.on("messageCreate", async (message) => {
      if (message.author.bot) return;

      console.log("Pesan masuk:", message.content);

      if (message.content.toLowerCase().startsWith("!afk")) {
        const reason = message.content.slice(5).trim() || "AFK";

        afkUsers.set(message.author.id, { reason });

        await message.reply({
          embeds: [
            {
              description: `<@${message.author.id}> | set your AFK: ${reason}`,
            },
          ],
        });

        return;
      }

      const data = afkUsers.get(message.author.id);

      if (data) {
        afkUsers.delete(message.author.id);
        message.reply("AFK kamu sudah dihapus!");
      }
    });


    // 🔥 BARU DI BAWAH INI
    await loadCommands();
    await client.login(token);
