# Spec Delta

## Purpose

Asegurar que el gráfico "Tendencia reciente" de Reportes se dibuje sobre el fondo del contenedor, sin capas opacas que oculten el área de trazado, preservando la lectura de datos y la interacción existente.

## ADDED Requirements

### Requirement: Fondo limpio en el gráfico de tendencia

El gráfico "Tendencia reciente" SHALL renderizar el área de trazado sin rectángulos de fondo opacos detrás de las barras, tanto en reposo como durante la interacción con el tooltip, y MUST NOT mostrar un fondo negro al activarse el tooltip.

#### Scenario: Tooltip activo con una sola categoría

- **WHEN** el usuario pasa el cursor sobre el gráfico que tiene una única categoría en la línea temporal
- **THEN** el área de trazado conserva el fondo del contenedor y no aparece un rectángulo negro que cubra su ancho

#### Scenario: Tooltip activo con varias categorías

- **WHEN** el usuario recorre el gráfico con varias categorías
- **THEN** la banda activa del tooltip no pinta un fondo opaco ni negro sobre las barras

#### Scenario: Gráfico en reposo

- **WHEN** el gráfico se muestra sin interacción
- **THEN** el área de trazado permanece transparente y las barras se ven sobre el fondo del contenedor

### Requirement: Preservación de la lectura del gráfico

La corrección SHALL conservar los datos, el apilado y los colores de las barras, el contenido del tooltip, los ejes, la leyenda y el layout del gráfico.

#### Scenario: Datos y colores intactos

- **WHEN** la tendencia recibe puntos con valores de pasados y fallidos
- **THEN** las barras mantienen sus colores verde/rojo, su apilado y sus proporciones

#### Scenario: Tooltip funcional

- **WHEN** el usuario pasa el cursor sobre una barra
- **THEN** el tooltip sigue mostrando la fecha completa y los valores de pasados y fallidos
