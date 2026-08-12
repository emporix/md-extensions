const TRANSLATIONS_DE = {
  // Agents view
  loading: 'Lädt...',
  loading_agents: 'Agenten werden geladen...',
  active: 'Aktiv',
  inactive: 'Inaktiv',
  configuration: 'Konfiguration',
  add_agent: 'Agent Hinzufügen',
  agents_title: 'KI-Agenten',
  agents_subtitle: 'Verwalten Sie Ihre vordefinierten KI-Agenten',
  custom_ai_agents: 'Benutzerdefinierte KI-Agenten',
  add_new_agent: 'NEUEN AGENT HINZUFÜGEN',
  my_agents: 'Meine Agenten',
  predefined_agents: 'Vordefinierte Agenten',
  predefined_agents_description:
    'Wir haben eine Reihe von verfügbaren Agenten in unserem System. Fügen Sie beliebige zu Ihrer Liste hinzu, benennen Sie sie um, um das gewünschte Ziel zu erreichen.',
  no_custom_agents: 'Noch keine benutzerdefinierten Agenten erstellt.',
  edit: 'Bearbeiten',
  configure: 'Konfigurieren',
  remove: 'Entfernen',
  view_logs: 'Logs',
  session: 'Sitzung',
  load_flow: 'Ablauf Laden',
  sessions: 'Sitzungen',
  no_sessions_available: 'Keine Sitzungen verfügbar',
  loading_sessions: 'Sitzungen werden geladen...',
  last_activity: 'Letzte Aktivität',
  messages: 'Nachrichten',
  back_to_logs: 'Zurück zu Logs',
  remove_agent: 'Agent entfernen',
  remove_tool: 'Tool entfernen',
  remove_token: 'Token entfernen',
  remove_mcp: 'MCP-Server entfernen',
  export: 'Exportieren',
  export_agent: 'Agent exportieren',
  exporting: 'Wird exportiert...',
  agent_exported_successfully: 'Agent erfolgreich exportiert',
  error_exporting_agent: 'Fehler beim Exportieren des Agenten',
  import_agent: 'Agent importieren',
  importing: 'Wird importiert...',
  agent_imported_successfully: 'Agent erfolgreich importiert',
  error_importing_agent: 'Fehler beim Importieren des Agenten',
  drag_drop_file: 'Ziehen Sie Ihre JSON-Datei hierher',
  or_click_to_browse: 'oder klicken Sie, um Dateien zu durchsuchen',
  browse_files: 'Dateien durchsuchen',
  invalid_file_type: 'Bitte wählen Sie eine gültige JSON-Datei',
  invalid_export_format: 'Ungültiges Exportdateiformat',
  please_wait_import:
    'Bitte warten Sie, während wir den Agenten importieren...',
  import_completed: 'Import abgeschlossen',
  enabled: 'Aktiviert',
  disabled: 'Deaktiviert',
  TO_CREATE: 'Zu erstellen',
  TO_CREATE_note:
    'Elemente, die als "Zu erstellen" markiert sind, müssen manuell hinzugefügt werden.',
  token_required_note:
    'Bitte stellen Sie sicher, dass die erforderlichen Tokens bereitgestellt werden, bevor Sie die importierten Entitäten aktivieren.',
  agents: 'Agenten',
  being_copied: 'wird kopiert',
  please_wait: 'Bitte warten Sie, während wir die Agentenvorlage kopieren...',
  error_creating_agent: 'Fehler beim Erstellen des Agenten',
  agent_creation_failed:
    'Beim Erstellen Ihres Agenten ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
  select_agent: 'Agent auswählen',
  agent_saved_success: 'Agent erfolgreich zur Liste hinzugefügt!',
  ok: 'OK',
  agent_saved_error: 'Agent konnte nicht hinzugefügt werden!',
  agent_saved_error_subtitle:
    'Bitte versuchen Sie, den Agenten erneut hinzuzufügen.',

  // Add Agent Dialog
  customize_agent_subtitle:
    'Passen Sie Name und Beschreibung an, damit sie besser zu Ihrer Aufgabe passen.',
  agent_bundle_install_notice:
    'Beim Installieren dieses Agenten werden zuerst diese Hilfsagenten erstellt: {{names}}.',
  bundle_helper_template_not_found:
    'Hilfsagent-Vorlage nicht gefunden: {{templateId}}.',
  agent_created_successfully: 'Agent erfolgreich erstellt!',
  agent_name: 'Agent Name',
  enter_agent_name: 'Agent Namen eingeben',
  description: 'Beschreibung',
  enter_description: 'Beschreibung eingeben',
  required_scopes: 'Erforderliche Bereiche',
  select_required_scopes: 'Erforderliche Bereiche auswählen',
  scope_anonymous: 'Anonym',
  scope_customer: 'Kunde',
  scope_employee: 'Mitarbeiter',
  scope_integration: 'Integration',
  discard: 'VERWERFEN',
  save_agent: 'AGENT SPEICHERN',
  agent_id: 'ID',
  enter_agent_id: 'Agent ID eingeben',
  user_prompt: 'Benutzer-Prompt',
  user_prompt_placeholder: 'Der Benutzer-Prompt wird hier angezeigt',
  template_prompt: 'Vorlagen-Prompt',
  template_prompt_placeholder: 'Der Vorlagen-Prompt wird hier angezeigt',
  output_format: 'Ausgabeformat',
  output_format_placeholder:
    'Optionales JSON Schema zur Definition der Struktur der Agentenantwort (z. B. {"type": "object", "properties": {"answer": {"type": "string"}}})',
  format_json_schema: 'JSON Schema formatieren',
  generate_json_schema: 'JSON Schema generieren',
  generate_json_schema_working: 'JSON Schema wird generiert…',
  assistant_stream_waiting: 'Warte auf Antwort…',
  assistant_stream_complete: 'Generierung abgeschlossen',
  assistant_stream_running_tool: '{{toolName}} wird ausgeführt…',
  generate_json_schema_prompt_placeholder:
    'z. B. Ein Objekt mit einer String-Antwort und einem numerischen Konfidenzwert zwischen 0 und 1',
  output_format_invalid_json:
    'Ungültiges JSON. Bitte überprüfen Sie die Syntax und versuchen Sie es erneut.',
  output_format_invalid_json_schema:
    'Ungültiges JSON Schema. Fügen Sie mindestens ein Schema-Schlüsselwort hinzu (z. B. type, properties) und stellen Sie gültige Werte sicher.',

  json_schema_assistant_checking: 'Prüfe, ob der Hilfeagent verfügbar ist…',
  json_schema_assistant_intro:
    'Verwenden Sie einen dedizierten Hilfeagenten, um die erwartete Agentenantwort in natürlicher Sprache zu beschreiben und JSON Schema für dieses Feld zu erhalten. Der Hilfeagent ist deaktiviert, bis Sie ihn einmal aus unseren vordefinierten Vorlagen erstellen.',
  json_schema_assistant_enable: 'Hilfeagent aktivieren',
  json_schema_assistant_agent_created: 'Hilfeagent wurde erstellt.',
  json_schema_assistant_agent_exists:
    'Hilfeagent existiert bereits. Sie können Ihr Schema unten beschreiben.',
  json_schema_assistant_extract_failed:
    'In der Agentenantwort wurde kein gültiges JSON Schema gefunden. Fordern Sie nur JSON an oder versuchen Sie es erneut.',
  json_schema_assistant_applied:
    'JSON Schema wurde übernommen. Überprüfen Sie das Ausgabeformat-Feld.',
  json_schema_assistant_create_failed:
    'Der Hilfeagent konnte nicht erstellt oder aktiviert werden.',
  json_schema_assistant_chat_failed:
    'Der Hilfeagent hat keine verwertbare Antwort zurückgegeben.',
  json_schema_assistant_empty_response:
    'Der Hilfeagent hat eine leere Nachricht zurückgegeben.',
  json_schema_assistant_template_not_found:
    'Die JSON-Schema-Hilfevorlage ist für diesen Mandanten nicht verfügbar.',
  json_schema_assistant_enable_failed:
    'Der vorhandene Hilfeagent konnte nicht aktiviert werden.',
  helper_agent_availability_check_failed:
    'Verfügbarkeit des Hilfeagenten konnte nicht geprüft werden.',

  // Agent Configuration Panel
  agent_config_panel_title: 'Agent-Konfiguration',
  agent_configuration: 'Agent-Konfiguration',
  general: 'Allgemein',
  connection: 'Verbindung',
  settings: 'Einstellungen',
  tool_tabs: 'Tool-Konfigurationsregisterkarten',
  triggers_section_title: 'Trigger',
  trigger: 'Trigger',
  generate_condition: 'Bedingung generieren',
  generate_condition_working: 'Bedingung wird generiert…',
  commerce_filter_assistant_generating: 'Bedingungs-JSON wird generiert…',
  generate_condition_prompt_placeholder:
    'z. B. Trigger einen Agenten, wenn siteCode DE ist und published true ist',
  select_an_option: 'Option auswählen',
  reset: 'ZURÜCKSETZEN',
  apply: 'ANWENDEN',
  triggers_and_constraints: 'Trigger & Einschränkungen',
  constraints: 'Einschränkungen',
  new_agent: 'Neuer Agent',
  agent_not_found: 'Agent nicht gefunden',
  error_loading_agent: 'Fehler beim Laden des Agenten',
  back_to_agents: 'Zurück zu Agenten',
  agent_tabs: 'Agent-Konfigurationsregisterkarten',
  agent_config_panel_subtitle:
    'Passen Sie Name und Beschreibung an, um sie besser an Ihre spezifischen Bedürfnisse anzupassen.',
  trigger_types: 'Auslöser-Typen',
  select_trigger_types: 'Auslöser-Typen auswählen',
  confirm_save_agent: 'Speichern und Agent deaktivieren',
  save_and_deactivate: 'Speichern und deaktivieren',
  confirm_disable_agent_message:
    'Sie können den aktivierten Agenten mit diesen Fehlern nicht speichern. Sie können den Agenten speichern, indem Sie ihn zuerst deaktivieren.',
  close: 'Schließen',
  trigger_type: 'Auslöser-Typ',
  trigger_type_endpoint: 'ENDPUNKT',
  trigger_type_scheduled: 'GEPLANT',
  trigger_type_api: 'API',
  trigger_type_time: 'Zeitgesteuert',
  trigger_type_commerce: 'Commerce-Ereignis',
  trigger_type_slack: 'Slack',
  trigger_type_teams: 'Microsoft Teams',
  channel_trigger_tool_hint:
    'Bei Slack- oder Teams-Auswahl muss auf der Registerkarte Tools genau ein passendes natives Tool zugewiesen sein.',
  teams_default_inbound_agent: 'Standard-Eingangsagent',
  teams_default_inbound_agent_tooltip:
    'Optional. Agent, der die erste eingehende Teams-Nachricht in diesem Team verarbeitet, wenn noch keine Konversation existiert. Beim Speichern werden Teams-Trigger und Tool diesem Agenten zugewiesen. Leer lassen, um Cold-Inbound-Routing zu deaktivieren.',
  teams_default_inbound_agent_hint:
    'Leer lassen, um Cold-Inbound-Routing zu deaktivieren.',
  teams_default_inbound_agent_not_found:
    'Ausgewählter Standard-Eingangsagent wurde nicht gefunden. Aktualisieren und erneut versuchen.',
  conversations: 'Konversationen',
  conversation_name: 'Kanal / Chat',
  filter_by_conversation_name: 'Nach Kanal / Chat filtern',
  no_conversations_found_with_filters:
    'Keine Konversationen für die Filter gefunden',
  conversations_tab_hint:
    'Zuweisungen entstehen, wenn ein Agent in Slack oder Teams kollaboriert oder jemand zum ersten Mal dem Bot schreibt. Zeile anklicken, um Sitzungsprotokolle zu öffnen.',
  error_loading_conversations: 'Konversationen konnten nicht geladen werden',
  loading_conversations: 'Konversationen werden geladen...',
  not_available: 'k. A.',
  teams_allowed_operations: 'Erlaubte Operationen',
  teams_allowed_operations_hint:
    'Maximale Operationen, die dieses Teams-Tool bereitstellen darf. Agenten können die Teilmenge pro Zuordnung weiter einschränken.',
  teams_agent_allowed_operations: 'Erlaubte Aktionen für diesen Agenten',
  teams_agent_allowed_operations_hint:
    'Wählen Sie, welche Teams-Aktionen dieser Agent aufrufen darf. Die Optionen sind durch die Tool-Konfiguration begrenzt.',
  teams_team_config_conflict:
    'Ein anderes Teams-Tool nutzt bereits diese Tenant- und Team-Kombination. Pro Paar ist nur ein Tool erlaubt.',
  teams_operation_sendMessage: 'Nachricht senden',
  teams_operation_createChat: 'Chat erstellen',
  teams_operation_createChannel: 'Kanal erstellen',
  teams_operation_inviteParticipants: 'Teilnehmer einladen',
  teams_operation_collaborateOnChannel: 'Auf Kanal zusammenarbeiten',
  teams_operation_collaborateOnChat: 'Im Chat zusammenarbeiten',
  slack_default_inbound_agent: 'Standard-Eingangsagent',
  slack_default_inbound_agent_tooltip:
    'Optional. Agent, der die erste eingehende Slack-Nachricht in diesem Workspace verarbeitet, wenn noch keine Konversation existiert. Leer lassen, um Cold-Inbound-Routing zu deaktivieren.',
  slack_default_inbound_agent_hint:
    'Leer lassen, um Cold-Inbound-Routing zu deaktivieren.',
  slack_allowed_operations: 'Erlaubte Operationen',
  slack_allowed_operations_hint:
    'Maximale Operationen, die dieses Slack-Tool bereitstellen darf. Agenten können die Teilmenge pro Zuordnung weiter einschränken.',
  slack_agent_allowed_operations: 'Erlaubte Aktionen für diesen Agenten',
  slack_agent_allowed_operations_hint:
    'Wähle, welche Slack-Aktionen dieser Agent ausführen darf. Optionen sind durch die Tool-Konfiguration begrenzt.',
  slack_team_id_hint:
    'Slack-Workspace-(Team-)ID zur Zuordnung eingehender Ereignisse an dieses Tool.',
  slack_team_id_hint_immutable:
    'Die Slack-Workspace-ID kann nach der Tool-Erstellung nicht geändert werden.',
  slack_team_config_conflict:
    'Ein anderes Slack-Tool nutzt bereits diese Workspace-ID. Pro Workspace ist nur ein Tool erlaubt.',
  slack_operation_sendMessage: 'Nachricht senden',
  slack_operation_createChannel: 'Kanal erstellen',
  slack_operation_inviteParticipants: 'Teilnehmer einladen',
  slack_operation_collaborateOnChannel: 'Auf Kanal zusammenarbeiten',
  prompt: 'Prompt',
  llm_config: 'LLM-Konfiguration',
  model: 'Modell',
  temperature: 'Temperatur',
  max_tokens: 'Max. Token',
  api_keys: 'API-Schlüssel',
  recursion_limit: 'Rekursionsgrenze',
  enable_memory: 'Speicher aktivieren',
  collaboration: 'Kollaboration',
  collaboration_listings: 'Kollaborationsliste',
  collaboration_prompt: 'Prompt',
  collaboration_please_select: 'Bitte auswählen',
  collaboration_prompt_placeholder: 'Kollaborations-Prompt eingeben',

  // Agent categories
  security: 'Sicherheit',
  productivity: 'Produktivität',
  finance: 'Finanzen',
  complaint: 'Beschwerde',

  // Pages
  tools: 'Tools',
  available_tools: 'Verfügbare Tools',
  search_for_tools: 'Tools suchen..',
  tools_semantic_search_subtitle: 'Tool für semantische Suche',
  tools_domain_subtitle_order: 'Bestellungen, Retouren und Rechnungen',
  tools_domain_subtitle_product: 'Katalog, Preise und Verfügbarkeit',
  tools_domain_subtitle_frontend: 'Warenkorb, Checkout und Storefront',
  tools_domain_subtitle_extensibility: 'Benutzerdefinierte Typen und Instanzen',
  tools_domain_subtitle_customer: 'Kunden, Gesellschaften und Standorte',
  available_tools_list_heading: 'Verfügbare Tools',
  no_tools_selected: 'Keine Tools ausgewählt',
  selected_tools_count: 'Ausgewählte Tools ({{count}})',
  custom_mcp_tag: 'Benutzerdefiniertes MCP',
  custom_mcp_servers: 'Benutzerdefinierte MCP-Server',
  loading_mcp_servers: 'MCP-Server werden geladen...',
  expand_section: 'Abschnitt erweitern',
  collapse_section: 'Abschnitt einklappen',
  expand_text: 'Text erweitern',
  collapse_text: 'Text einklappen',
  show_all: 'Alle anzeigen',
  show_less: 'Weniger anzeigen',
  copy_all_logs: 'Alle Protokolle kopieren',
  copy_all_logs_to_clipboard: 'Alle Protokolle in die Zwischenablage kopieren',
  logs_copied_to_clipboard: 'Protokolle in die Zwischenablage kopiert',
  failed_to_copy_logs: 'Protokolle konnten nicht kopiert werden',
  analyze_logs: 'Protokolle analysieren',
  analyze_logs_dialog_title: 'Protokolle analysieren',
  log_analysis_assistant_checking:
    'Verfügbarkeit des Hilfsagenten wird geprüft...',
  log_analysis_assistant_intro:
    'Nutzen Sie einen dedizierten Hilfsagenten zur Analyse dieser Protokolle. Sie können ihn einmalig aus unseren vordefinierten Vorlagen erstellen.',
  log_analysis_assistant_enable: 'Hilfsagenten aktivieren',
  log_analysis_assistant_agent_created: 'Hilfsagent erstellt.',
  log_analysis_assistant_agent_exists: 'Hilfsagent existiert bereits.',
  log_analysis_assistant_create_failed:
    'Hilfsagent konnte nicht erstellt oder aktiviert werden.',
  log_analysis_assistant_chat_failed:
    'Der Hilfsagent hat keine verwertbare Antwort geliefert.',
  log_analysis_assistant_empty_response:
    'Der Hilfsagent hat eine leere Nachricht zurückgegeben.',
  log_analysis_assistant_template_not_found:
    'Die Vorlage für den Protokollanalyse-Hilfsagenten ist für diesen Mandanten nicht verfügbar.',
  log_analysis_assistant_enable_failed:
    'Der vorhandene Hilfsagent konnte nicht aktiviert werden.',
  log_analysis_starting:
    '{{count}} Protokollnachrichten auf Laufzeitfehler prüfen',
  log_analysis_chat_placeholder: 'Stellen Sie eine Folgefrage...',
  send: 'Senden',
  no_tools: 'Keine Tools verfügbar',
  add_new_tool: 'NEUES TOOL HINZUFÜGEN',
  new_tool: 'Neues Tool',
  back_to_tools: 'Zurück zu Tools',
  tool_not_found: 'Tool nicht gefunden',
  error_loading_tool: 'Fehler beim Laden des Tools',
  tool_detail_subtitle:
    'Tool-Einstellungen für Agenten-Integrationen konfigurieren.',
  slack: 'Slack',
  rag_custom: 'RAG Custom',
  rag_emporix: 'RAG Emporix',
  tool_id: 'Tool-ID',
  enter_tool_id: 'Tool-ID eingeben',
  tool_name: 'Tool-Name',
  enter_tool_name: 'Tool-Name eingeben',
  tool_created_successfully: 'Tool erfolgreich erstellt!',
  tool_updated_successfully: 'Tool erfolgreich aktualisiert!',
  error_saving_tool: 'Fehler beim Speichern des Tools',
  delete_tool: 'Tool löschen',
  delete_tool_confirmation:
    'Sind Sie sicher, dass Sie dieses Tool löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.',
  tool_deleted_successfully: 'Tool erfolgreich gelöscht!',
  entity_type_missing: 'Entity-Typ fehlt in der Tool-Konfiguration',
  reindex_tool: 'Tool neu indizieren',
  reindex: 'Neu indizieren',
  reindex_only_available_for_product:
    'Neuindizierung ist nur für den Entitätstyp Produkt verfügbar',
  reindex_triggered_successfully: 'Neuindizierung erfolgreich gestartet!',
  reindex_completed_successfully: 'Neuindizierung erfolgreich abgeschlossen!',
  reindex_job_failed: 'Neuindizierungsauftrag fehlgeschlagen.',
  reindex_job_already_in_progress:
    'Für diesen Entitätstyp läuft bereits ein Neuindizierungsauftrag.',
  error_triggering_reindex: 'Fehler beim Starten der Neuindizierung',
  failed_to_trigger_reindex: 'Neuindizierung konnte nicht gestartet werden.',
  reindex_confirmation:
    'Dies ist eine zeitaufwändige Operation, die alle Embeddings neu generiert. Bitte gehen Sie mit Vorsicht vor. Möchten Sie wirklich fortfahren?',
  results: 'Ergebnisse',
  max_results: 'Max. Ergebnisse',
  enter_max_results: 'Max. Ergebnisse eingeben (1-100)',
  max_results_range: 'Max. Ergebnisse müssen zwischen 1 und 100 liegen',
  database_configuration: 'Datenbank-Konfiguration',
  database_url: 'Datenbank-URL',
  enter_database_url: 'Datenbank-URL eingeben',
  database_type: 'Datenbank-Typ',
  qdrant: 'Qdrant',
  microsoft_teams: 'Microsoft Teams',
  tool_type_tool: '{{type}}-Tool',
  entity_type: 'Entity-Typ',
  select_entity_type: 'Entity-Typ auswählen',
  loading_entity_types: 'Entity-Typen werden geladen...',
  product: 'Produkt',
  order: 'Bestellung',
  collection_name: 'Collection-Name',
  enter_collection_name: 'Collection-Name eingeben',
  embedding_configuration: 'Embedding-Konfiguration',
  indexed_fields: 'Indizierte Felder',
  indexed_fields_description:
    'Konfigurieren Sie die Felder, die für die Suche indiziert werden sollen',
  field_name: 'Name',
  enter_field_name: 'Feldname eingeben',
  field_key: 'Schlüssel',
  select_field_key: 'Feldschlüssel auswählen',
  remove_field: 'Feld entfernen',
  remove_filter_field: 'Filterfeld entfernen',
  add_indexed_field: 'Indiziertes Feld hinzufügen',
  add_custom_field: 'Benutzerdefiniertes Feld hinzufügen',
  enter_custom_field_key: 'Feldpfad eingeben (z.B. mixins.feldname)',
  custom_field_key_invalid:
    'Feldpfad muss mit "mixins." beginnen und einen gültigen Pfad enthalten',
  filter_fields: 'Filterfelder',
  filter_fields_description:
    'Wählen Sie Felder aus, mit denen der Agent die Vektorsuchergebnisse vor der Abfrage filtern kann',
  add_filter_field: 'Filterfeld hinzufügen',
  select_filter_field_key: 'Filterfeld auswählen',
  field_description: 'Beschreibung',
  enter_field_description: 'Feldbeschreibung eingeben (für LLM-Kontext)',
  error_loading_filter_fields: 'Fehler beim Laden der verfügbaren Filterfelder',
  force_delete_tool: 'Tool erzwungen löschen',
  force_delete_tool_message:
    'Tool wird von Agenten verwendet.\nDurch das Löschen wird es aus den Agenten entfernt und die Agenten werden deaktiviert.',
  force_delete: 'Erzwungen löschen',
  force_disable: 'Erzwungen deaktivieren',
  force_disable_tool: 'Tool erzwungen deaktivieren',
  force_disable_tool_message:
    'Tool wird von Agenten verwendet. Durch die Deaktivierung werden auch die Agenten deaktiviert.',
  cannot_delete_active_tool: 'Aktives Tool kann nicht gelöscht werden',
  tool_disabled: 'Dieses Tool ist derzeit deaktiviert',
  error_loading_tokens: 'Fehler beim Laden der verfügbaren Tokens',
  error_loading_fields: 'Fehler beim Laden der verfügbaren Felder',
  error_loading_entity_types:
    'Fehler beim Laden der Entity-Typen. Produkt ist weiterhin verfügbar.',
  failed_to_save_tool: 'Tool konnte nicht gespeichert werden',

  // Tokens
  tokens: 'Token',
  no_tokens: 'Keine Token verfügbar',
  add_new_token: 'NEUES TOKEN HINZUFÜGEN',
  new_token: 'Neues Token',
  back_to_tokens: 'Zurück zu Token',
  token_not_found: 'Token nicht gefunden',
  error_loading_token: 'Fehler beim Laden des Tokens',
  token_detail_subtitle:
    'Token-Zugangsdaten für Agenten und MCP-Server konfigurieren.',
  token_id: 'Token-ID',
  enter_token_id: 'Token-ID eingeben',
  token_name: 'Token-Name',
  enter_token_name: 'Token-Name eingeben',
  token_value: 'Token-Wert',
  enter_token_value: 'Token-Wert eingeben',
  token_created_successfully: 'Token erfolgreich erstellt!',
  token_updated_successfully: 'Token erfolgreich aktualisiert!',
  error_saving_token: 'Fehler beim Speichern des Tokens',
  delete_token: 'Token löschen',
  delete_token_confirmation:
    'Sind Sie sicher, dass Sie dieses Token löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.',
  token_deleted_successfully: 'Token erfolgreich gelöscht!',
  force_delete_token: 'Token erzwungen löschen',
  force_delete_token_message:
    'Token wird von Agenten oder MCP-Servern verwendet.\nDurch das Löschen wird es aus den Agenten und MCP-Servern entfernt und die Agenten werden deaktiviert.',
  failed_to_delete_token: 'Token konnte nicht gelöscht werden',
  token_type_anthropic: 'Anthropic',
  token_type_api: 'API-Token',

  // OAuth
  oauths: 'OAuth',
  no_oauths: 'Keine OAuth-Konfigurationen verfügbar',
  add_new_oauth: 'NEUES OAUTH HINZUFÜGEN',
  new_oauth: 'Neues OAuth',
  back_to_oauths: 'Zurück zu OAuth',
  oauth_not_found: 'OAuth-Konfiguration nicht gefunden',
  error_loading_oauth: 'Fehler beim Laden der OAuth-Konfiguration',
  error_loading_oauths: 'Fehler beim Laden der OAuth-Konfigurationen',
  oauth_detail_subtitle:
    'OAuth-Client-Zugangsdaten für die Authentifizierung selbst gehosteter LLMs konfigurieren.',
  oauth_id: 'OAuth-ID',
  enter_oauth_id: 'OAuth-ID eingeben',
  oauth_created_successfully: 'OAuth-Konfiguration erfolgreich erstellt!',
  oauth_updated_successfully: 'OAuth-Konfiguration erfolgreich aktualisiert!',
  oauth_activated_successfully: 'OAuth-Konfiguration erfolgreich aktiviert!',
  oauth_deactivated_successfully:
    'OAuth-Konfiguration erfolgreich deaktiviert!',
  error_saving_oauth: 'Fehler beim Speichern der OAuth-Konfiguration',
  error_updating_oauth: 'Fehler beim Aktualisieren der OAuth-Konfiguration',
  delete_oauth: 'OAuth löschen',
  delete_oauth_confirmation:
    'Sind Sie sicher, dass Sie diese OAuth-Konfiguration löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.',
  oauth_deleted_successfully: 'OAuth-Konfiguration erfolgreich gelöscht!',
  force_delete_oauth: 'OAuth erzwungen löschen',
  force_delete_oauth_message:
    'OAuth-Konfiguration wird von Agenten verwendet.\nDurch das Löschen wird sie aus den Agenten entfernt und die Agenten werden deaktiviert.',
  force_disable_oauth: 'OAuth erzwungen deaktivieren',
  force_disable_oauth_message:
    'OAuth-Konfiguration wird von Agenten verwendet. Durch das Deaktivieren werden die Agenten ebenfalls deaktiviert.',
  failed_to_delete_oauth: 'OAuth-Konfiguration konnte nicht gelöscht werden',
  cannot_delete_active_oauth:
    'Aktive OAuth-Konfiguration kann nicht gelöscht werden',
  remove_oauth: 'OAuth entfernen',
  oauth: 'OAuth',
  select_oauth: 'OAuth-Konfiguration auswählen',
  loading_oauths: 'OAuth-Konfigurationen werden geladen...',

  // Common UI
  save: 'Speichern',
  cancel: 'Abbrechen',
  error: 'Fehler',
  success: 'Erfolgreich',
  token: 'Token',
  select_token: 'Token auswählen',
  loading_tokens: 'Lade Token...',
  native_tools: 'Native Tools',
  native_tool_chip_team: 'Team: {{teamId}}',
  native_tool_chip_tenant: 'Mandant: {{tenantId}}',
  native_tool_chip_bot_token: 'Bot-Token: ••••••••',
  native_tool_chip_generic: '{{type}}-Tool',
  select_tools: 'Tools auswählen',
  select_tools_placeholder: 'Tools auswählen',
  search_tools: 'Tools durchsuchen',
  loading_tools: 'Lade Tools...',
  select_tool: 'Tool auswählen',
  select_tool_placeholder: 'Tool zum Hinzufügen auswählen',
  add_mcp_server: 'MCP-Server hinzufügen',
  select_mcp_server: 'MCP-Server auswählen',
  select_mcp_server_placeholder: 'MCP-Server auswählen',
  delete_agent: 'Agent löschen',
  delete_agent_confirmation:
    'Sind Sie sicher, dass Sie diesen Agenten löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.',
  force_delete_agent: 'Agent erzwungen löschen',
  force_delete_agent_message:
    'Agent wird von anderen Agenten als Agent-Kollaboration verwendet.\nDurch das Löschen wird der Agent aus Kollaborationen entfernt und verwandte Agenten können deaktiviert werden.',
  updating: 'Aktualisiere...',
  cannot_delete_active_agent: 'Aktiver Agent kann nicht gelöscht werden',
  add_tool: 'Tool hinzufügen',
  tool_type: 'Tool-Typ',
  select_tool_type: 'Tool-Typ auswählen',
  team_id: 'Team-ID',
  enter_team_id: 'Team-ID eingeben',
  bot_token: 'Bot-Token',
  enter_bot_token: 'Bot-Token eingeben',
  teams_not_available: 'Microsoft Teams Integration ist noch nicht verfügbar',
  update: 'Aktualisieren',
  agent_collaboration: 'Agent-Kollaboration',
  add_collaboration: 'Kollaboration hinzufügen',

  // MCP Servers
  mcp_servers: 'MCP-Server',
  mcp_servers_description: 'Verwalten Sie Ihre Model Context Protocol Server',
  failed_to_load_mcp_servers: 'MCP-Server konnten nicht geladen werden',
  no_mcp_servers: 'Keine MCP-Server verfügbar',
  add_new_mcp_server: 'NEUEN MCP-SERVER HINZUFÜGEN',
  mcp_server: 'MCP-Server',
  new_mcp_server: 'Neuer MCP-Server',
  back_to_mcp_servers: 'Zurück zu MCP-Servern',
  error_loading_mcp_server: 'Fehler beim Laden des MCP-Servers',
  mcp_detail_subtitle:
    'MCP-Server-Verbindungseinstellungen für Agenten konfigurieren.',
  mcp_server_created_successfully: 'MCP-Server erfolgreich erstellt!',
  mcp_server_configuration: 'MCP-Server-Konfiguration',
  mcp_server_id: 'MCP-Server-ID',
  enter_mcp_server_id: 'MCP-Server-ID eingeben',
  mcp_server_name: 'MCP-Server-Name',
  enter_mcp_server_name: 'MCP-Server-Name eingeben',
  transport: 'Transport',
  select_transport: 'Transport auswählen',
  mcp_transport_sse: 'Server-Sent Events (SSE)',
  mcp_transport_streamable_http: 'Streamable HTTP',
  url: 'URL',
  enter_url: 'URL eingeben',
  authorization_header_name: 'Authorization-Header-Name',
  enter_authorization_header_name: 'Authorization-Header-Name eingeben',
  authorization_header_token_id: 'Authorization-Header-Token-ID',
  enter_authorization_header_token_id: 'Authorization-Header-Token-ID eingeben',
  optional: 'Optional',
  mcp_server_updated_successfully: 'MCP-Server erfolgreich aktualisiert!',
  mcp_server_activated_successfully: 'MCP-Server erfolgreich aktiviert!',
  mcp_server_deactivated_successfully: 'MCP-Server erfolgreich deaktiviert!',
  error_saving_mcp_server: 'Fehler beim Speichern des MCP-Servers',
  error_updating_mcp_server: 'Fehler beim Aktualisieren des MCP-Servers',
  failed_to_delete_mcp_server: 'MCP-Server konnte nicht gelöscht werden',
  mcp_server_not_found: 'MCP-Server nicht gefunden',
  delete_mcp_server: 'MCP-Server löschen',
  delete_mcp_server_confirmation:
    'Sind Sie sicher, dass Sie diesen MCP-Server löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.',
  mcp_server_deleted_successfully: 'MCP-Server erfolgreich gelöscht!',
  force_delete_mcp: 'MCP-Server erzwungen löschen',
  force_delete_mcp_message:
    'MCP-Server wird von Agenten verwendet.\nDurch das Löschen wird er aus den Agenten entfernt und die Agenten werden deaktiviert.',
  force_disable_mcp: 'MCP-Server erzwungen deaktivieren',
  force_disable_mcp_message:
    'MCP-Server wird von Agenten verwendet. Durch die Deaktivierung werden auch die Agenten deaktiviert.',
  cannot_delete_active_mcp: 'Aktiver MCP-Server kann nicht gelöscht werden',
  mcp_server_disabled: 'Dieser MCP-Server ist derzeit deaktiviert',
  mcp_tools_selected: '{{count}} Tools ausgewählt',
  custom_mcp_server: 'Benutzerdefinierter MCP-Server',
  unknown_mcp_server: 'Unbekannter Server',
  invalid_mcp_configuration: 'Ungültige Konfiguration',
  add: 'Hinzufügen',
  delete: 'Löschen',
  type: 'Typ',
  mcp: 'MCP',
  mcp_tools: 'Tools',
  name: 'Name',
  transport_layer: 'Transport-Schicht',
  headers: 'Header',
  emporix: 'Emporix',
  custom: 'Benutzerdefiniert',
  icon: 'Symbol',
  select_icon: 'Symbol auswählen',
  enter_prompt: 'Prompt eingeben',
  provider: 'Anbieter',
  provider_required: 'Anbieter ist erforderlich',
  llm_provider_openai: 'OpenAI',
  llm_provider_anthropic: 'Anthropic',
  llm_provider_google: 'Google',
  llm_provider_emporix_openai: 'Emporix OpenAI',
  llm_provider_self_hosted_ollama: 'Self-Hosted Ollama',
  llm_provider_self_hosted_vllm: 'Self-hosted VLLM',
  dimensions: 'Dimensionen',
  enter_dimensions: 'Dimensionen eingeben (128-4096)',
  dimensions_range: 'Dimensionen müssen zwischen 128 und 4096 liegen',
  enter_model: 'Modellname eingeben',
  select_model: 'Modell auswählen',
  loading_models: 'Lade Modelle...',
  error_loading_models: 'Fehler beim Laden der verfügbaren Modelle',
  no_models_available: 'Keine Modelle verfügbar',
  model_thinking_badge: 'THINKING',
  model_self_hosted_headers: 'Zusätzliche Header',
  select_provider: 'Anbieter auswählen',
  base_provider: 'Basis-Anbieter',
  select_base_provider: 'Basis-Anbieter auswählen',
  provider_type: 'Modelle',
  model_input_mode_list: 'Standard',
  model_input_mode_custom: 'Benutzerdefiniert',
  search_for_models: 'Modelle suchen..',
  no_models_match_search: 'Keine Modelle entsprechen Ihrer Suche',
  custom_model_name: 'Benutzerdefinierter Modellname',
  custom_model_name_tooltip:
    'Geben Sie eine von Ihrem Anbieter unterstützte Modellkennung ein',
  enable_memory_support: 'Speicherunterstützung aktivieren',
  disable_temperature: 'Temperatur deaktivieren',
  disable_temperature_tooltip:
    'Einige Modelle unterstützen keine Temperatur. Aktivieren Sie diese Option, um die Temperatur aus der Agenten-Konfiguration wegzulassen.',
  api_key: 'API-Schlüssel',
  enter_api_key: 'API-Schlüssel eingeben',
  tags: 'Tags',
  select_tags: 'Tags auswählen',
  select_tag: 'Tag auswählen',
  no_tag: 'Kein Tag',

  // Self-hosted LLM translations
  self_hosted_url: 'Self-hosted URL',
  enter_self_hosted_url: 'Self-hosted URL eingeben',
  authorization_token: 'Autorisierungs-Token',
  use_oauth_authentication: 'OAuth-Authentifizierung verwenden',
  oauth_url: 'OAuth-URL',
  enter_oauth_url: 'OAuth-Token-URL eingeben',
  oauth_client_id: 'Client-ID',
  enter_oauth_client_id: 'OAuth-Client-ID eingeben',
  oauth_client_secret: 'Client-Secret',
  oauth_grant_type: 'Grant-Typ',
  select_oauth_grant_type: 'Grant-Typ auswählen',
  grant_type_client_credentials: 'Client Credentials',
  oauth_scope: 'Scope',
  enter_oauth_scope: 'OAuth-Scope eingeben',

  // Slack tool installation
  install_emporix_slack_ai: 'Emporix Slack AI installieren',
  install_slack: 'Slack installieren',
  add_to_slack: 'Zu Slack hinzufügen',
  slack_install_description:
    'Schnelle Einrichtung mit einem Klick. Konfiguriert automatisch Ihren Slack-Arbeitsbereich mit den erforderlichen Berechtigungen.',
  provide_values_manually: 'Werte manuell eingeben',
  manual_config_description:
    'Geben Sie Ihre Slack-Arbeitsbereich-Details manuell ein, wenn Sie eine benutzerdefinierte Konfiguration bevorzugen.',
  or: 'oder',
  error_app_state_missing: 'Anwendungsstatus fehlt',
  error_slack_installation: 'Fehler beim Initiieren der Slack-Installation',
  failed_to_initiate_slack_installation:
    'Slack-Installation konnte nicht gestartet werden',

  // Microsoft Teams tool installation
  install_teams: 'Microsoft Teams installieren',
  install_emporix_teams_ai: 'Emporix Microsoft Teams AI installieren',
  connect_teams: 'Microsoft Teams verbinden',
  teams_install_description:
    'Richten Sie Emporix AI in Ihrem Microsoft-365-Mandanten ein. Ein Teams-Administrator muss die Emporix-App zuerst im Mandanten-Katalog bereitstellen. Erteilen Sie dann die Graph-Admin-Einwilligung, installieren Sie die App für Benutzer und vervollständigen Sie die Einstellungen.',
  grant_teams_graph_consent: 'Graph-Admin-Einwilligung erteilen',
  teams_graph_consent_tenant_hint:
    'Azure-AD-Mandanten-ID (Entra ID) des Kunden. Wird für Graph-Admin-Einwilligung und mandantenspezifische Teams-Installationslinks verwendet.',
  teams_graph_consent_requires_tenant_id:
    'Geben Sie die Azure-AD-Mandanten-ID ein, bevor Sie die Graph-Admin-Einwilligung erteilen.',
  teams_graph_consent_url_missing:
    'Graph-Admin-Einwilligung ist im AI-Service nicht konfiguriert.',
  teams_graph_consent_success:
    'Graph-Admin-Einwilligung erteilt. Öffnen Sie Einstellungen, geben Sie Ihre Team-ID ein und speichern Sie.',
  teams_graph_consent_error: 'Graph-Admin-Einwilligung fehlgeschlagen',
  teams_graph_consent_unknown:
    'Graph-Admin-Einwilligung lieferte ein unbekanntes Ergebnis',
  teams_install_requires_tool_id:
    'Legen Sie auf dem Tab Allgemein zuerst eine Tool-ID fest. Nach der Admin-Einwilligung leitet Microsoft zurück zu diesem Tool-Editor.',
  teams_install_step_tenant_id:
    'Geben Sie die Azure-AD-Mandanten-ID des Kunden im Feld oben ein.',
  teams_install_step_org_catalog:
    'Teams-Administrator: Laden Sie das App-Paket unten herunter und laden Sie es im Teams-Admincenter unter Teams-Apps → Apps verwalten hoch. Setzen Sie die App auf Zugelassen und weisen Sie sie bei Bedarf per App-Berechtigungsrichtlinie zu. Nur einmal pro Kundenmandant erforderlich.',
  teams_install_step_graph_consent:
    'Erteilen Sie die Admin-Einwilligung für die Emporix-Graph-App (erforderlich für ausgehende Zusammenarbeit und Bot-Installation in Gruppenchats). Verwenden Sie unten Graph-Admin-Einwilligung erteilen.',
  teams_install_step_connect:
    'Klicken Sie auf Microsoft Teams verbinden, um die Installationsseite im Kundenmandanten zu öffnen. Fügen Sie die App einem Team hinzu (nicht nur für den persönlichen Gebrauch). Schlägt der Link fehl, prüfen Sie, ob die App im Mandanten-Katalog vorhanden ist und die Mandanten-ID stimmt.',
  install_status_pending:
    'Die Installation bleibt ausstehend, bis die App im Mandanten-Katalog vorhanden ist, ein Benutzer sie installiert hat und der Bot seine erste Aktivität empfangen hat.',
  teams_install_step_sideload:
    'Fallback: Laden Sie das Emporix-App-Paket über Teams → Apps → Apps verwalten → Benutzerdefinierte App hochladen hoch (erfordert Richtlinie für benutzerdefinierte Apps).',
  teams_install_step_settings:
    'Öffnen Sie den Tab Einstellungen: fügen Sie die Team-ID mithilfe der Anleitung unter dem Feld Team-ID ein, bestätigen Sie die Mandanten-ID, konfigurieren Sie erlaubte Operationen und speichern Sie. Die Team-ID kann nach dem ersten Speichern nicht mehr geändert werden.',
  teams_install_how_to_find_team_id: 'So ermitteln Sie die Team-ID',
  teams_install_team_id_intro:
    'Die Team-ID ist die Microsoft-365-Gruppen-ID (GUID) des Zielteams — derselbe Wert wie groupId in einem Teams-Teamlink.',
  teams_install_team_id_method_teams_app_title: 'Über Microsoft Teams',
  teams_install_team_id_method_teams_app_1:
    'Öffnen Sie Teams und wählen Sie das Zielteam in der Seitenleiste.',
  teams_install_team_id_method_teams_app_2:
    'Klicken Sie auf ⋯ neben dem Teamnamen und wählen Sie Link zum Team abrufen.',
  teams_install_team_id_method_teams_app_3:
    'Kopieren Sie den Link, fügen Sie ihn in einen Texteditor ein und kopieren Sie den Wert des groupId-Query-Parameters.',
  teams_install_team_id_method_admin_title: 'Über das Teams-Admincenter',
  teams_install_team_id_method_admin_1:
    'Öffnen Sie das Teams-Admincenter → Teams → Teams verwalten.',
  teams_install_team_id_method_admin_2:
    'Wählen Sie das Zielteam und kopieren Sie die Gruppen-ID (oder exportieren Sie die Teamliste).',
  teams_install_team_id_example:
    'Beispiel: …?groupId=0efcc002-6001-4a21-991b-8ba10bac0612&tenantId=… — fügen Sie den groupId-Wert als Team-ID ein.',
  teams_install_team_id_team_scope_warning:
    'Die App muss einem Team hinzugefügt werden. Eine reine persönliche Installation hat keine Team-ID.',
  teams_install_state_id_hint:
    'Installations-Korrelations-ID: {{id}}. Teilen Sie diese mit dem Support, wenn Sie Hilfe bei der Installation benötigen.',
  open_teams_apps: 'Teams (Web) öffnen',
  download_teams_app_package: 'App-Paket herunterladen',
  open_teams_admin_center: 'Teams-Admincenter öffnen',
  error_teams_installation: 'Fehler beim Initiieren der Teams-Installation',
  failed_to_initiate_teams_installation:
    'Teams-Installation konnte nicht gestartet werden',
  tenant_id: 'Mandanten-ID (AAD)',
  enter_tenant_id: 'Azure AD-Mandanten-ID eingeben',
  teams_team_id_hint:
    'Microsoft-365-Gruppen-ID (GUID) des Zielteams. Kopieren Sie groupId aus einem Teamlink oder die Gruppen-ID aus dem Teams-Admincenter (siehe So ermitteln Sie die Team-ID unten). Vor dem Speichern prüfen — die Team-ID kann später nicht geändert werden.',
  teams_team_id_hint_immutable:
    'Die Team-ID kann nach der Erstellung des Tools nicht mehr geändert werden.',
  teams_tenant_id_hint:
    'Azure-AD-Mandanten-ID aus der Bot-Installationsaktivität (channelData.tenant.id). Erforderlich, um Ihren Microsoft-365-Mandanten an dieses Tool zu binden.',
  teams_tenant_id_hint_immutable:
    'Die Mandanten-ID kann nach der Erstellung des Tools nicht mehr geändert werden.',

  commerce_events: 'Commerce-Ereignisse',
  select_events: 'Ereignisse auswählen',
  select_events_placeholder:
    'Ereignisse auswählen, die diesen Agenten auslösen',
  loading_events: 'Ereignisse werden geladen...',
  no_events_available: 'Keine Ereignisse verfügbar',
  error_loading_commerce_events: 'Fehler beim Laden der Commerce-Ereignisse',
  commerce_event_filter: 'Bedingungen für Commerce-Ereignisse',
  commerce_event_filter_optional: '(optional)',

  commerce_filter_tab_form: 'Filter',
  commerce_filter_tab_json: 'Bedingung',
  commerce_filter_tab_assistant: 'Assistent',
  commerce_filter_payload_field: 'Payload-Pfad',
  commerce_filter_payload_placeholder: 'z. B. siteCode',
  commerce_filter_values: 'Werte',
  commerce_filter_single_value_placeholder: 'z. B. DE',
  commerce_filter_operator: 'Operator',
  commerce_filter_value: 'Wert',
  commerce_filter_csv_placeholder: 'Kommagetrennte Werte',
  commerce_filter_invalid:
    'Vervollständigen Sie den Filter oder beheben Sie Validierungsfehler.',
  commerce_filter_apply_json: 'JSON anwenden',
  commerce_filter_invalid_json: 'Ungültiger Filter',
  commerce_filter_json_parse_error: 'JSON konnte nicht gelesen werden',
  commerce_filter_reset: 'Zurücksetzen',
  commerce_filter_remove: 'Filter entfernen',
  commerce_filter_none:
    'Kein Filter konfiguriert. Klicken Sie auf „Filter hinzufügen“.',
  commerce_filter_add: 'Filter hinzufügen',
  copy: 'Kopieren',

  commerce_filter_op_equals: 'Gleich',
  commerce_filter_op_notEquals: 'Ungleich',
  commerce_filter_op_in: 'In',
  commerce_filter_op_notIn: 'Nicht in',
  commerce_filter_op_exists: 'Existiert',
  commerce_filter_op_notExists: 'Existiert nicht',
  commerce_filter_op_isEmpty: 'Ist leer',
  commerce_filter_op_notEmpty: 'Nicht leer',

  commerce_filter_combine: 'Wie sollen Bedingungen verknüpft werden?',
  commerce_filter_match_all: 'Alle Bedingungen (AND)',
  commerce_filter_match_any: 'Beliebige Bedingung (OR)',
  commerce_filter_need_two_for_logic:
    'Fügen Sie eine zweite Bedingung hinzu, um AND/OR zwischen Regeln zu nutzen.',
  commerce_filter_add_condition: 'Bedingung hinzufügen',
  commerce_filter_remove_condition: 'Bedingung entfernen',
  commerce_filter_rule_label: 'Bedingung {{n}}',
  commerce_filter_complex_use_json:
    'Die visuelle Bearbeitung wird für die ausgewählte Bedingung derzeit nicht unterstützt. Bitte nutzen Sie die JSON-Ansicht (oder verwalten Sie die Bedingung mit dem KI-Generator).',

  commerce_filter_assistant_checking: 'Prüfe, ob der Hilfeagent verfügbar ist…',
  commerce_filter_assistant_intro:
    'Nutzen Sie einen speziellen Hilfeagenten, um Filter in natürlicher Sprache zu beschreiben und JSON für dieses Tab zu erhalten. Der Hilfeagent muss einmalig aus den vordefinierten Vorlagen angelegt werden.',
  commerce_filter_assistant_enable: 'Hilfeagent aktivieren',
  commerce_filter_assistant_agent_created: 'Hilfeagent wurde erstellt.',
  commerce_filter_assistant_agent_exists:
    'Hilfeagent existiert bereits. Sie können Ihren Filter unten beschreiben.',
  commerce_filter_assistant_prompt_label: 'Filter beschreiben',
  commerce_filter_assistant_prompt_placeholder:
    'z. B. Nur auslösen wenn siteCode main und Währung EUR',
  commerce_filter_assistant_generate: 'Bedingungs-JSON erzeugen',
  commerce_filter_assistant_extract_failed:
    'In der Antwort des Agenten wurde kein gültiges JSON gefunden. Bitten Sie nur um JSON oder versuchen Sie es erneut.',
  commerce_filter_assistant_applied:
    'Bedingungs-JSON wurde übernommen. Bitte Tab „Bedingung“ prüfen.',
  commerce_filter_assistant_create_failed:
    'Der Hilfeagent konnte nicht erstellt oder aktiviert werden.',
  commerce_filter_assistant_chat_failed:
    'Der Hilfeagent lieferte keine verwertbare Antwort.',
  commerce_filter_assistant_empty_response:
    'Der Hilfeagent hat eine leere Nachricht zurückgegeben.',
  commerce_filter_assistant_template_not_found:
    'Die Vorlage für den Commerce-Filter-Hilfeagenten ist für diesen Mandanten nicht verfügbar.',
  commerce_filter_assistant_enable_failed:
    'Der vorhandene Hilfeagent konnte nicht aktiviert werden.',

  commerce_filter_parse_unsupported_operator:
    'Nicht unterstützter oder fehlender Operator für diese Bedingung.',
  commerce_filter_parse_field_left_required:
    'Feld (Payload-Pfad) ist für jede Bedingung erforderlich.',
  commerce_filter_parse_value_list_required:
    'Für diesen Operator ist eine nicht-leere Wertliste erforderlich.',
  commerce_filter_parse_value_must_be_array:
    'Die Werte müssen für diesen Operator ein JSON-Array sein.',
  commerce_filter_parse_list_strings_only:
    'Alle Einträge in der Liste müssen Zeichenketten sein.',
  commerce_filter_parse_scalar_required:
    'Für diesen Operator ist ein nicht-leerer Wert erforderlich.',
  commerce_filter_parse_scalar_type:
    'Der Wert muss eine Zeichenkette, Zahl oder ein boolescher Wert sein.',
  commerce_filter_parse_filter_must_be_object:
    'Der Filter muss ein JSON-Objekt sein.',
  commerce_filter_parse_compound_op_invalid:
    'Verbundfilter müssen op „$and“ oder „$or“ verwenden.',
  commerce_filter_parse_conditions_non_empty:
    '„conditions“ muss ein nicht-leeres Array sein.',
  commerce_filter_parse_invalid_condition_at_position:
    'Ungültige Bedingung an Position {{position}}.',

  // Logs
  agent_logs: 'Agentenprotokolle',
  no_logs_available: 'Keine Protokolle verfügbar',
  refresh: 'Aktualisieren',
  log_details: 'Protokoll-Details',
  loading_log_details: 'Lade Protokoll-Details...',
  no_log_selected: 'Kein Protokoll ausgewählt',
  session_id: 'Sitzungs-ID',
  request_id: 'Anfrage-ID',
  total_messages: 'Gesamte Nachrichten',
  severity: 'Schweregrad',
  timestamp: 'Zeitstempel',
  message: 'Nachricht',
  errors: 'Fehler',
  duration: 'Dauer',
  duration_seconds: '{{count}} Sek.',
  agent: 'Agent',
  no_messages: 'Keine Nachrichten gefunden',
  result: 'Ergebnis',
  logs_agent_id: 'Agent-ID',
  jobs: 'Jobs',
  requests: 'Anfragen',
  no_jobs_available: 'Keine Jobs verfügbar',
  job_details: 'Job-Details',
  loading_job_details: 'Lade Job-Details...',
  no_job_selected: 'Kein Job ausgewählt',
  job_id: 'Job-ID',
  agent_type: 'Agent-Typ',
  job_type: 'Job-Typ',
  response: 'Antwort',
  communication: 'Kommunikation',
  no_content: 'Kein Inhalt',
  created_at: 'Erstellt am',
  related_logs: 'Protokolle',
  trigger_agent: 'Auslöser-Agent',
  included_agents: 'Beteiligte Agenten',
  no_logs_found: 'Keine Protokolle gefunden',
  loading_logs: 'Lade Protokolle...',
  import_result: 'Import-Ergebnis',
  export_result: 'Export-Ergebnis',
  export_summary: 'Export-Zusammenfassung',
  exported_data: 'Exportierte Daten',
  download: 'Herunterladen',
  summary: 'Zusammenfassung',
  mcp_servers_label: 'MCP-Server',
  checksum: 'Prüfsumme',
  data_size: 'Datengröße',
  characters: 'Zeichen',
  status: 'Status',

  // Filter translations
  filter_by_job_id: 'Nach Job-ID filtern',
  filter_by_agent_id: 'Nach Agent-ID filtern',
  filter_by_type: 'Nach Typ filtern',
  filter_by_status: 'Nach Status filtern',
  filter_by_created_at: 'Nach Erstellungsdatum filtern',
  filter_by_request_id: 'Nach Anfrage-ID filtern',
  filter_by_session_id: 'Nach Sitzungs-ID filtern',
  filter_by_timestamp: 'Nach Zeitstempel filtern',
  filter_by_error_count: 'Nach Fehleranzahl filtern',
  filter_by_started_at: 'Nach Startzeit filtern',
  filter_by_last_activity: 'Nach letzter Aktivität filtern',
  filter_by_severity: 'Nach Schweregrad filtern',
  filter_by_included_agents: 'Nach enthaltenen Agenten filtern',
  filter_by_message: 'Nach Nachricht filtern',
  select_severity: 'Schweregrad auswählen',
  clear_filters: 'Filter löschen',
  no_jobs_found_with_filters:
    'Keine Jobs gefunden, die den Filtern entsprechen',
  no_logs_found_with_filters:
    'Keine Protokolle gefunden, die den Filtern entsprechen',
  no_sessions_found_with_filters:
    'Keine Sitzungen gefunden, die den Filtern entsprechen',

  // Agent filter
  agent_filter: 'Agent-Filter',
  search_agents: 'Agenten suchen...',
  of: 'von',
  no_agents_selected: 'Keine Agenten ausgewählt',
  back_to_sessions: 'Zurück zu Sitzungen',

  // Metrics and Analytics
  no_trend_data: 'Keine Trenddaten verfügbar',
  error_rate_percent: 'Fehlerrate (%)',
  total_requests: 'Gesamte Anfragen',

  // Session Metrics
  session_severity_distribution: 'Sitzungsschweregrad-Verteilung',
  session_error_trend_4_weeks: 'Sitzungsfehlerverlauf (Letzten 4 Wochen)',
  total_sessions: 'Gesamte Sitzungen',
  error_sessions: 'Fehlersitzungen',
  no_session_data: 'Keine Sitzungsdaten verfügbar',
  week: 'Woche',

  // Resolution Efficiency
  resolution_efficiency: 'Lösungseffizienz',
  requests_per_session: 'Anfragen pro Sitzung',
  efficiency_hint:
    'Niedriger ist besser - weniger Anfragen pro Sitzung erforderlich',

  // Chart Tooltips
  error_sessions_label: 'Fehlersitzungen',
  total_sessions_label: 'Gesamte Sitzungen',

  // Field Tooltips
  required_scopes_tooltip:
    "Anonymous - keine zusätzlichen Berechtigung erforderlich für Chat mit Agent\nCustomer - benötigt 'ai.agentexecution_manage_own' Berechtigung für Chat mit Agent\nEmployee, Integration - benötigt 'ai.agentexecution_manage' Berechtigung für Chat mit Agent\n\nBerechtigungsvalidierung wird für Commerce Events ignoriert*",

  // Localized Input
  show_languages: 'Sprachen anzeigen',
  hide_languages: 'Sprachen ausblenden',
}

export default TRANSLATIONS_DE
