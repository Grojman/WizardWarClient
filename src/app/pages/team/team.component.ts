import { Component, OnInit } from '@angular/core';
import { WebsocketService } from '../../core/services/websocket.service';
import { TranslationService } from '../../core/services/translation.service';

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
export class TeamComponent implements OnInit {

  constructor(
    private ws: WebsocketService,
    private translation: TranslationService,
  ) {}

  ngOnInit(): void {
    // This page never sends its own requests, but it still has to be the
    // WebsocketService's active subscriber (see WebsocketService.subscribe)
    // so it can catch the "translations" push if it's the first page loaded
    // (e.g. a direct /team URL) — otherwise it's silently swallowed by the
    // socket's default no-op handler and every `| translate` on this page
    // falls back to showing the raw key.
    this.ws.subscribe(this.processMessage);
  }

  processMessage = (msg: any): boolean => {
    switch (msg.Type) {
      case 'translations':
        this.translation.setDictionary(msg.Content?.values ?? {});
        break;
      default:
        return true;
    }
    return false;
  };

  collaborators: TeamMember[] = [
    {
      name: 'Sofía',
      instagram: '',
      photo: '',
      roleLead: 'TEAM_COLLAB1_ROLE',
      titles: [
        
      ]
    }
  ]

  members: TeamMember[] = [
    {
      name: 'gomidev.developer',
      instagram: 'gomidev.developer',
      photo: '/images/devs/gomidev.developer.webp',
      roleLead: 'TEAM_DEV1_ROLE',
      titles: [
        'TEAM_DEV1_TITLE_01',
        'TEAM_DEV1_TITLE_02',
        'TEAM_DEV1_TITLE_03',
        'TEAM_DEV1_TITLE_04',
        'TEAM_DEV1_TITLE_05',
        'TEAM_DEV1_TITLE_06',
        'TEAM_DEV1_TITLE_07',
        'TEAM_DEV1_TITLE_08',
        'TEAM_DEV1_TITLE_09',
        'TEAM_DEV1_TITLE_10',
        'TEAM_DEV1_TITLE_11',
        'TEAM_DEV1_TITLE_12',
        'TEAM_DEV1_TITLE_13',
        'TEAM_DEV1_TITLE_14',
        'TEAM_DEV1_TITLE_15',
        'TEAM_DEV1_TITLE_16',
        'TEAM_DEV1_TITLE_17',
        'TEAM_DEV1_TITLE_18',
        'TEAM_DEV1_TITLE_19',
        'TEAM_DEV1_TITLE_20',
        'TEAM_DEV1_TITLE_21',
        'TEAM_DEV1_TITLE_22',
        'TEAM_DEV1_TITLE_23',
        'TEAM_DEV1_TITLE_24',
        'TEAM_DEV1_TITLE_25',
        'TEAM_DEV1_TITLE_26',
      ],
    },
    {
      name: 'aweonao_crea',
      instagram: 'aweonao_crea',
      photo: '/images/devs/aweonao_crea.webp',
      roleLead: 'TEAM_DEV2_ROLE',
      titles: [
        'TEAM_DEV2_TITLE_01',
        'TEAM_DEV2_TITLE_02',
        'TEAM_DEV2_TITLE_03',
        'TEAM_DEV2_TITLE_04',
        'TEAM_DEV2_TITLE_05',
        'TEAM_DEV2_TITLE_06',
        'TEAM_DEV2_TITLE_07',
        'TEAM_DEV2_TITLE_08',
        'TEAM_DEV2_TITLE_09',
        'TEAM_DEV2_TITLE_10',
        'TEAM_DEV2_TITLE_11',
        'TEAM_DEV2_TITLE_12',
        'TEAM_DEV2_TITLE_13',
        'TEAM_DEV2_TITLE_14',
        'TEAM_DEV2_TITLE_15',
        'TEAM_DEV2_TITLE_16',
        'TEAM_DEV2_TITLE_17',
        'TEAM_DEV2_TITLE_18',
        'TEAM_DEV2_TITLE_19',
        'TEAM_DEV2_TITLE_20',
        'TEAM_DEV2_TITLE_21',
        'TEAM_DEV2_TITLE_22',
      ],
    },
  ];

}
