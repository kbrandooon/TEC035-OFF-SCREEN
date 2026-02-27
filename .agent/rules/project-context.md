---
trigger: always_on
---

# Project Description – Off Screen

## Overview

The project consists of developing an internal application for **Off Screen**, an audiovisual production studio that currently rents out:

- Studio space  
- Cameras  
- Lighting equipment  
- Grip equipment (rigging/truss/support gear)  
- General technical equipment  

The business model is based on managing audiovisual productions, where each production is handled as a **project** that includes the rental of the studio space and, in many cases, additional equipment rentals.

---

## Operational Model

Each project represents a specific production scheduled for a defined date and time range.

The studio operates under an **exclusive availability model**, meaning:

- If the studio is rented for a specific time slot, it cannot be assigned to another client during the same time range.
- Availability must be managed clearly and visually to prevent scheduling conflicts.

In addition to studio rental, each project may include equipment rental. Equipment is managed as part of a controlled inventory. Each piece of equipment is treated as an individual asset (for example, a specific camera or a specific light) and can also be occupied during a given time range.

---

## System Requirements

An internal application must be developed for Off Screen administrators with the following features:

### 1. Main Dashboard

- A large, visual calendar as the main view  
- Clear visualization of upcoming rentals  
- Client identification  
- Occupancy time ranges (start and end times)  
- Studio availability status  

---

### 2. Project Management (Productions)

Each project must allow:

- Client registration  
- Rental date selection  
- Start time and end time selection  
- Internal notes or observations  
- Hourly rate definition (there is no fixed public pricing)  
- Automatic total calculation based on booked hours  
- Invoicing option:
  - If an invoice is required, VAT must be added  
  - If no invoice is required, the base amount remains unchanged  

---

### 3. Equipment Rental (Inventory Management)

Equipment rental works as an add-on to the studio rental:

- There is an inventory of individual items (e.g., a specific camera, a specific light, etc.)  
- Each item can be either available or occupied depending on the scheduled time  
- The system must prevent double-booking of the same equipment within overlapping time ranges  
- Equipment must be associated with the corresponding project  

---

## Example Scenario

Brandon rents the studio tomorrow from **2:00 PM to 6:00 PM** and also requests specific cameras and lighting equipment.

The system must:

- Block the studio for that entire time range  
- Block the assigned equipment for the same time range  
- Prevent any overlapping bookings for both space and equipment  

---

## Overall Objective

The goal is to create a visual, clear, and efficient internal tool that allows administrators to:

- Control studio availability  
- Manage productions as structured projects  
- Manage equipment inventory  
- Prevent scheduling conflicts  
- Automatically calculate rental amounts and taxes  
- Have full visibility into the studio’s daily operations  