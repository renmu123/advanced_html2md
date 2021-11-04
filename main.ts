import {
	App,
	Editor,
	MarkdownView,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
const TurndownService = require("turndown");
const turndownPluginGfm = require("turndown-plugin-gfm");
// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	github: boolean;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	github: true,
};

export default class advancedPastePlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new advancedPastePluginSettingTab(this.app, this));

		const turndownService = await this.init();

		this.addCommand({
			id: "paste",
			name: "paste",
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const text = await this.getClipboardContents();

				const markdown = turndownService.turndown(text);
				editor.replaceSelection(markdown);
			},
		});
	}
	async getClipboardContents() {
		try {
			const clipboardItems = await navigator.clipboard.read();
			let value;

			for (const clipboardItem of clipboardItems) {
				const types = clipboardItem.types;
				if (types.includes("text/html")) {
					const blob = await clipboardItem.getType("text/html");
					value = await blob.text();
				} else {
					const blob = await clipboardItem.getType("text/plain");
					value = await blob.text();
				}
			}
			return value;
		} catch (err) {
			console.error(err.name, err.message);
		}
	}
	async init() {
		const turndownService = new TurndownService({
			headingStyle: "atx",
			bulletListMarker: "-",
			emDelimiter: "*",
			codeBlockStyle: "fenced",
		});

		if (this.settings.github) {
			const gfm = turndownPluginGfm.gfm;
			turndownService.use(gfm);
		}
		turndownService.addRule("strikethrough", {
			filter: ["del", "s", "strike"],
			replacement: function (content: any) {
				return "~~" + content + "~~";
			},
		});
		return turndownService;
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class advancedPastePluginSettingTab extends PluginSettingTab {
	plugin: advancedPastePlugin;

	constructor(app: App, plugin: advancedPastePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Settings" });

		new Setting(containerEl)
			.setName(
				"github suport (You should reload the plugin to make the setting effect.)"
			)
			.setDesc("strikethrough,tables,taskListItems support")
			.addToggle((value) =>
				value
					.setValue(this.plugin.settings.github)
					.onChange(async (value) => {
						this.plugin.settings.github = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
