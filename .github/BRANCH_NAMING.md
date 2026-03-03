# Branch Naming Convention — METAMEN100

## Formato

```
{type}/{caja}.{subcaja}/{description}
```

## Types (alineados con commitlint)

| Type     | Uso                                  |
| -------- | ------------------------------------ |
| feat     | Nueva funcionalidad                  |
| fix      | Corrección de bug                    |
| docs     | Solo documentación                   |
| style    | Formato, sin cambios de lógica       |
| refactor | Refactorización sin cambio funcional |
| perf     | Mejora de rendimiento                |
| test     | Agregar o corregir tests             |
| build    | Sistema de build o dependencias      |
| ci       | Configuración de CI/CD               |
| chore    | Mantenimiento general                |
| revert   | Revertir un cambio previo            |

## Cajas del Proyecto

| Caja | Nombre                      |
| ---- | --------------------------- |
| 02   | Proyecto Base               |
| 03   | Base de Datos               |
| 04   | Motor Core                  |
| 05   | Auth & Onboarding           |
| 06   | Dashboard & Task UI         |
| 07   | Judgement Night Integration |
| 08   | Generación IA               |
| 09   | Pagos                       |
| 10   | Deploy & Launch             |

> **Nota:** La Caja 01 (Documentación/Specs) no genera branches de código.

## Reglas

1. La descripción usa kebab-case (minúsculas separadas por guiones).
2. La descripción debe ser corta y descriptiva (max 40 caracteres).
3. El type debe ser uno de los 11 listados arriba.
4. La referencia caja.subcaja corresponde al ID de la tarea en TAREAS_CAJA_X.

## Ejemplos válidos

```
feat/02.6/inngest-setup
fix/04.1/vector-clamp
chore/02.4/ci-lighthouse
test/04.2/vector-calculations
docs/02.3/branch-naming
ci/02.4/github-actions
```

## Ejemplos inválidos

```
feature/add-login              # type 'feature' no existe, falta caja
FEAT/02.6/inngest-setup        # type debe ser lowercase
feat/inngest-setup             # falta referencia de caja.subcaja
feat/02.6/Inngest_Setup        # descripcion debe ser kebab-case
```

## Ramas protegidas

| Rama    | Protección                                               |
| ------- | -------------------------------------------------------- |
| main    | Branch principal de producción. Solo merge via PR.       |
| develop | Rama de integración (cuando se cree). Solo merge via PR. |

> **Nota:** Las branch protection rules se configuran manualmente en GitHub Settings > Branches > Branch protection rules.
