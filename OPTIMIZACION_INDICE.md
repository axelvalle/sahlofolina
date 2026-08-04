# Optimización del índice

## Causas localizadas

- Cada tarjeta utilizaba `backdrop-filter: blur(...)` sobre un fondo fijo que además permanecía animado. El navegador debía recomponer y desenfocar varias superficies durante el desplazamiento.
- `content-visibility: auto` se aplicaba a una lista corta de tarjetas. En este caso provocaba activación tardía de cada tarjeta durante el scroll, en lugar de ahorrar trabajo útil.
- El índice se reconstruía nodo por nodo dentro del DOM visible cada vez que se cambiaba de parte o arco.
- Cada tarjeta recibía un listener individual nuevo tras cada reconstrucción.
- Los fondos se cargaban y decodificaban al momento de seleccionar una parte, lo que podía coincidir con la transición visual.
- La imagen del índice de la Parte III era el fondo más pesado del conjunto.

## Cambios aplicados

- Las tarjetas conservan transparencia y profundidad mediante fondos compuestos, pero ya no ejecutan desenfoque en tiempo real.
- El desenfoque también se retiró de los selectores de parte, arcos y estados vacíos del índice.
- Las tarjetas usan contención de layout y pintura, sin activación tardía durante el scroll.
- Todo el índice se construye primero dentro de un `DocumentFragment` y se inserta en una sola operación.
- La navegación de capítulos usa delegación de eventos mediante `data-action="open-chapter"`.
- El render se omite cuando la parte, arco y estado de lectura no han cambiado.
- Los índices narrativos por parte se calculan una vez y se reutilizan.
- Los conteos de los tres arcos de Parte V se calculan en una sola pasada.
- Los cinco fondos se precargan y decodifican durante tiempo inactivo del navegador.
- Solo la capa activa del fondo permanece visible y animada; las demás se ocultan después del fundido.
- La imagen del índice de Parte III se redujo de 581,518 a 413,986 bytes, conservando resolución suficiente para pantalla.
- Las animaciones ambientales, transiciones de opacidad y desplazamientos de hover se conservaron.
