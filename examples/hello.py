from dataclasses import dataclass


@dataclass
class Project:
    name: str
    stars: int


def trending(projects: list[Project]) -> list[str]:
    """Find the projects worth a closer look."""
    return [p.name for p in projects if p.stars >= 100]


projects = [Project("codeimage", 128), Project("tiny-cli", 42)]
print(trending(projects))
