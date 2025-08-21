/*
  Warnings:

  - A unique constraint covering the columns `[pageNumber,component]` on the table `ComponentConfig` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "ComponentConfig_pageNumber_idx" ON "ComponentConfig"("pageNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ComponentConfig_pageNumber_component_key" ON "ComponentConfig"("pageNumber", "component");
