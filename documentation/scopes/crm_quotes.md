# CRM & Quoting Engine (Módulo 4)

Este módulo gestiona el ciclo de vida comercial desde que entra un lead hasta que se confirma una reserva en el calendario de StudioOS.

## Objetivos del Módulo
- Capturar y calificar prospectos (Leads) de forma visual.
- Generar cotizaciones precisas basadas en tiempo (horas) y catálogo de equipos.
- Automatizar la creación de reservas operativas al aceptar una propuesta.

## Funcionalidades Implementadas

### 1. Gestión de Leads (CRM)
- **Visual Snapshot**: Visualización de los equipos solicitados mediante galería de miniaturas.
- **Estatus de Ventas**: Flujo de estados (Nuevo, Calificado, Cotizado, Perdido, Cancelado).
- **Integración Operativa**: Cálculo automático de la duración de la reserva basada en ventanas de tiempo.

### 2. Motor de Cotizaciones (Quoting Engine)
- **Cálculo por Horas**: Lógica de facturación horaria con redondeo automático al entero superior (`Math.ceil`).
- **Modelo de Precios Netos**: Los precios ingresados o del catálogo se consideran con IVA incluido (Netos). El sistema desglosa el Subtotal e IVA automáticamente dividiendo por 1.16.
- **Selector de Catálogo**: Búsqueda dinámica de equipos y estudios directamente de la base de datos con carga de tarifas automáticas.
- **Personalización de Totales**: Toggle para desbloquear el campo de "Total Neto" por artículo, permitiendo ajustes manuales de precio sin alterar el catálogo.

### 3. Persistencia y Exportación
- **Persistencia**: Almacenamiento relacional en tablas `quotes` y `quote_items`.
- **Exportación PDF**: Generación de documentos profesionales mediante estilos CSS optimizados para impresión (`@media print`), evitando dependencias externas pesadas.

### 4. Automatización de Cierre (Conversion)
- **Confirmación de Reserva**: Al aceptar una cotización:
  1. Se crea el perfil de **Cliente** (si es nuevo).
  2. Se inserta el registro en la tabla `bookings`.
  3. Se vinculan los equipos en `booking_equipments` para control de disponibilidad.
  4. Se actualiza el estatus comercial automáticamente.

## Esquema de Datos
- `public.quotes`: Cabecera de la cotización (totales, cliente, tenant).
- `public.quote_items`: Detalle de artículos vinculados a la cotización.
- RLS: Aislación total por `tenant_id` mediante claims de JWT (`app_metadata`).

## Estándares de Código
- **Screaming Architecture**: Lógica co-localizada en `src/features/crm-leads` y `src/features/crm-quotes`.
- **Calculations**: Centralizadas en `quote-converters.ts` para asegurar consistencia entre la carga inicial y la edición manual.
