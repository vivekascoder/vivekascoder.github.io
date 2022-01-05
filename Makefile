.DEFAULT_GOAL := serve

help: ## Show all Makefile targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

serve: ## serve
	hugo-obsidian -input=content -output=data -index -root=. && hugo server

push:
	git add . && git commit -m "Updated on $(date)" && git push origin main