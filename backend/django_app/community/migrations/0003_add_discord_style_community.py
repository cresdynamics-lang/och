# Generated manually for Discord-style community module

import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def create_community_models(apps, schema_editor):
    """Create community models if they don't exist."""
    db_engine = schema_editor.connection.vendor

    # Skip for SQLite since tables might already exist
    if db_engine == 'sqlite':
        print("⚠️ Skipping community model creation for SQLite (tables may already exist)")
        return

    # For PostgreSQL, create the models normally
    # (Django will handle this automatically)


def remove_community_models(apps, schema_editor):
    """Remove community models."""
    # This will be handled automatically by Django's reverse migrations
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('community', '0002_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Community Roles
        migrations.CreateModel(
            name='CommunityRole',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('name', models.CharField(choices=[('student', 'Student'), ('student_mod', 'Student Moderator'), ('mentor', 'Mentor'), ('staff_admin', 'Staff Admin'), ('employer_guest', 'Employer Guest')], max_length=50, unique=True)),
                ('description', models.TextField(blank=True)),
                ('can_create_threads', models.BooleanField(default=True)),
                ('can_post_messages', models.BooleanField(default=True)),
                ('can_react_messages', models.BooleanField(default=True)),
                ('can_moderate', models.BooleanField(default=False, help_text='Can moderate content')),
                ('can_lock_threads', models.BooleanField(default=False)),
                ('can_pin_threads', models.BooleanField(default=False)),
                ('can_access_hidden_channels', models.BooleanField(default=False)),
                ('can_view_flagged_content', models.BooleanField(default=False)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'community_roles',
                'verbose_name': 'Community Role',
                'verbose_name_plural': 'Community Roles',
                'ordering': ['name'],
            },
        ),

        # Community Spaces
        migrations.CreateModel(
            name='CommunitySpace',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('slug', models.SlugField(help_text='URL-friendly identifier', unique=True)),
                ('title', models.CharField(help_text='Display title', max_length=255)),
                ('track_code', models.CharField(blank=True, help_text='Track code like defender, offensive', max_length=50, null=True)),
                ('level_slug', models.CharField(blank=True, help_text='Level slug like beginner, intermediate', max_length=50, null=True)),
                ('cohort_code', models.CharField(blank=True, help_text='Cohort identifier', max_length=50, null=True)),
                ('description', models.TextField(blank=True)),
                ('is_global', models.BooleanField(default=False, help_text='Global spaces like announcements')),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'community_spaces',
                'verbose_name': 'Community Space',
                'verbose_name_plural': 'Community Spaces',
                'ordering': ['title'],
            },
        ),

        # Community Channels
        migrations.CreateModel(
            name='CommunityChannel',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('slug', models.SlugField(help_text='URL-friendly identifier', max_length=100)),
                ('title', models.CharField(help_text='Display title with # prefix', max_length=255)),
                ('description', models.TextField(blank=True)),
                ('channel_type', models.CharField(choices=[('text', 'Text Channel'), ('announcement', 'Announcement Channel')], default='text', max_length=20)),
                ('sort_order', models.IntegerField(default=0, help_text='Display order within space')),
                ('is_hidden', models.BooleanField(default=False, help_text='Hidden from regular users')),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('space', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='channels', to='community.communityspace')),
            ],
            options={
                'db_table': 'community_channels',
                'verbose_name': 'Community Channel',
                'verbose_name_plural': 'Community Channels',
                'ordering': ['space', 'sort_order', 'title'],
                'unique_together': {('space', 'slug')},
            },
        ),

        # Community Threads
        migrations.CreateModel(
            name='CommunityThread',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('title', models.CharField(max_length=255)),
                ('thread_type', models.CharField(choices=[('generic', 'Generic Discussion'), ('mission', 'Mission Discussion'), ('recipe', 'Recipe Discussion'), ('module', 'Module Discussion')], default='generic', max_length=20)),
                ('mission_id', models.UUIDField(blank=True, help_text='Linked mission UUID', null=True)),
                ('recipe_slug', models.CharField(blank=True, help_text='Linked recipe slug', max_length=255, null=True)),
                ('module_id', models.UUIDField(blank=True, help_text='Linked curriculum module UUID', null=True)),
                ('is_locked', models.BooleanField(default=False, help_text='Thread locked from new messages')),
                ('is_pinned', models.BooleanField(default=False, help_text='Pinned thread')),
                ('is_active', models.BooleanField(default=True)),
                ('message_count', models.IntegerField(default=0, help_text='Cached message count')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('last_message_at', models.DateTimeField(auto_now_add=True)),
                ('channel', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='threads', to='community.communitychannel')),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='community_threads', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'community_threads',
                'verbose_name': 'Community Thread',
                'verbose_name_plural': 'Community Threads',
                'ordering': ['-last_message_at', '-created_at'],
            },
        ),

        # Community Messages
        migrations.CreateModel(
            name='CommunityMessage',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('body', models.TextField()),
                ('has_ai_flag', models.BooleanField(default=False, help_text='Flagged by AI moderation')),
                ('ai_flag_reason', models.TextField(blank=True, help_text='Reason for AI flag')),
                ('ai_confidence_score', models.DecimalField(blank=True, decimal_places=2, help_text='AI confidence score 0-1', max_digits=3, null=True)),
                ('metadata', models.JSONField(default=dict, help_text='Additional message metadata')),
                ('is_edited', models.BooleanField(default=False)),
                ('edited_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='community_messages', to=settings.AUTH_USER_MODEL)),
                ('reply_to_message', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='replies', to='community.communitymessage')),
                ('thread', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='messages', to='community.communitythread')),
            ],
            options={
                'db_table': 'community_messages',
                'verbose_name': 'Community Message',
                'verbose_name_plural': 'Community Messages',
                'ordering': ['created_at'],
            },
        ),

        # Message Reactions
        migrations.CreateModel(
            name='CommunityMessageReaction',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('emoji', models.CharField(help_text='Emoji character', max_length=50)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('message', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reactions', to='community.communitymessage')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='message_reactions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'community_message_reactions',
                'verbose_name': 'Message Reaction',
                'verbose_name_plural': 'Message Reactions',
                'ordering': ['created_at'],
                'unique_together': {('message', 'user', 'emoji')},
            },
        ),

        # Space Members
        migrations.CreateModel(
            name='CommunitySpaceMember',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('joined_at', models.DateTimeField(auto_now_add=True)),
                ('last_seen_at', models.DateTimeField(auto_now=True)),
                ('is_active', models.BooleanField(default=True)),
                ('role', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='members', to='community.communityrole')),
                ('space', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='members', to='community.communityspace')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='community_memberships', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'community_space_members',
                'verbose_name': 'Space Member',
                'verbose_name_plural': 'Space Members',
                'ordering': ['joined_at'],
                'unique_together': {('user', 'space')},
            },
        ),

        # Moderation Actions
        migrations.CreateModel(
            name='CommunityModerationAction',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('action_type', models.CharField(choices=[('approve', 'Approve Flagged Content'), ('edit', 'Edit Content'), ('delete', 'Delete Content'), ('warn', 'Warn User'), ('ban', 'Ban User'), ('lock_thread', 'Lock Thread'), ('unlock_thread', 'Unlock Thread'), ('pin_thread', 'Pin Thread'), ('unpin_thread', 'Unpin Thread')], max_length=20)),
                ('reason', models.TextField(help_text='Reason for moderation action')),
                ('notes', models.TextField(blank=True, help_text='Additional notes')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('message', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='moderation_actions', to='community.communitymessage')),
                ('moderator', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='moderation_actions', to=settings.AUTH_USER_MODEL)),
                ('target_user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='moderation_actions_taken', to=settings.AUTH_USER_MODEL)),
                ('thread', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='moderation_actions', to='community.communitythread')),
            ],
            options={
                'db_table': 'community_moderation_actions',
                'verbose_name': 'Moderation Action',
                'verbose_name_plural': 'Moderation Actions',
                'ordering': ['-created_at'],
            },
        ),
    ]
