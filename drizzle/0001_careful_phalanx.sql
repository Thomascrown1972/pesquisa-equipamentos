CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `equipments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoria` text,
	`subcategoria` text,
	`marca` text,
	`modelo` text,
	`cor` text,
	`compatibilidades` text,
	`cicloVida` text,
	`observacoes` text,
	`codSap` varchar(64),
	`pvpSemIva` varchar(32),
	`pvpComIva` varchar(32),
	`garantia` text,
	`assistenciaTecnica` text,
	`fichasProduto` text,
	`dataLancamento` timestamp,
	`dataDescontinuacao` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equipments_id` PRIMARY KEY(`id`)
);
