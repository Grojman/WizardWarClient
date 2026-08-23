import { Component } from '@angular/core';

interface TeamMember {
  name: string;
  instagram: string;
  photo: string;
  roleLead: string;
  titles: string[];
}

@Component({
  selector: 'app-team',
  standalone: false,
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.css'],
})
export class TeamComponent {

  collaborators: TeamMember[] = [
    {
      name: 'Sofía',
      instagram: '',
      photo: '',
      roleLead: 'Dibujante',
      titles: [
        
      ]
    }
  ]

  members: TeamMember[] = [
    {
      name: 'gomidev.developer',
      instagram: 'gomidev.developer',
      photo: '/images/devs/gomidev.developer.webp',
      roleLead: 'Área técnica',
      titles: [
        'Director Ejecutivo (CEO)',
        'Director Técnico (CTO)',
        'Programador Jefe',
        'Arquitecto de Software',
        'Desarrollador Backend Senior',
        'Desarrollador Frontend Senior',
        'Desarrollador Full Stack',
        'Ingeniero de Redes',
        'Ingeniero de WebSockets',
        'Administrador de Bases de Datos',
        'Administrador de Servidores',
        'Ingeniero DevOps',
        'Responsable de Infraestructura en la Nube',
        'Ingeniero de Seguridad Informática',
        'Líder de Control de Versiones',
        'Ingeniero de Rendimiento',
        'Programador de Inteligencia Artificial (los bots)',
        'Diseñador del Motor de Reglas',
        'Responsable de Matchmaking',
        'Ingeniero de QA Automatizado',
        'Cazador de Bugs Oficial',
        'Responsable de Builds y Despliegues',
        'Soporte Técnico Nivel 1, 2 y 3',
        'Redactor de la Documentación Técnica',
        'Traductor de "COSAS A CAMBIAR.txt"',
        'Responsable de que el servidor no se caiga a las 3 AM',
      ],
    },
    {
      name: 'aweonao_crea',
      instagram: 'aweonao_crea',
      photo: '/images/devs/aweonao_crea.webp',
      roleLead: 'Área gráfica',
      titles: [
        'Director Creativo',
        'Director de Arte',
        'Diseñador de Personajes',
        'Ilustrador de Cartas',
        'Artista de Conceptos',
        'Diseñador de Interfaz (UI/UX)',
        'Pintora de Splash Art',
        'Diseñador de Iconos',
        'Colorista Jefe',
        'Diseñador de Mazos',
        'Artista de Fondos y Escenarios',
        'Responsable de Tipografía',
        'Diseñador del Esqueleto de la Beta',
        'Diseñador del Logo',
        'Director de Identidad de Marca',
        'Community Manager Visual',
        'Diseñador de Redes Sociales',
        'Responsable de Animaciones',
        'Artista de Efectos Visuales',
        'Diseñador de Empaques (para cuando haya cartas físicas)',
        'Consultor de Estética General',
        'Encargado de que todo se vea bonito',
      ],
    },
  ];

}
