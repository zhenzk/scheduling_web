"""Initial migration

Revision ID: 08c40233d114
Revises: 
Create Date: 2025-04-13 05:26:24.063570

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '08c40233d114'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('shifts',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('start_time', sa.DateTime(timezone=True), nullable=False),
    sa.Column('end_time', sa.DateTime(timezone=True), nullable=False),
    sa.Column('shift_type', sa.String(length=20), nullable=False),
    sa.Column('required_mentors', sa.Integer(), nullable=True),
    sa.Column('required_staff', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('users',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('username', sa.String(length=50), nullable=False),
    sa.Column('password_hash', sa.String(length=255), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('email', sa.String(length=100), nullable=False),
    sa.Column('phone', sa.String(length=20), nullable=True),
    sa.Column('role', sa.String(length=20), nullable=True),
    sa.Column('is_trainee', sa.Boolean(), nullable=True),
    sa.Column('mentor_id', sa.UUID(), nullable=True),
    sa.Column('trainee_end_date', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=True),
    sa.ForeignKeyConstraint(['mentor_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('email')
    )
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    op.create_table('notifications',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('title', sa.String(length=100), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('is_read', sa.Boolean(), nullable=True),
    sa.Column('type', sa.String(length=20), nullable=False),
    sa.Column('related_id', sa.UUID(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('schedule_assignments',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('shift_id', sa.UUID(), nullable=False),
    sa.Column('is_primary', sa.Boolean(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['shift_id'], ['shifts.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'shift_id')
    )
    op.create_table('system_settings',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('key', sa.String(length=50), nullable=False),
    sa.Column('value', sa.String(), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('updated_by', sa.UUID(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['updated_by'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('key')
    )
    op.create_table('shift_swap_requests',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('requester_id', sa.UUID(), nullable=False),
    sa.Column('requester_shift_id', sa.UUID(), nullable=False),
    sa.Column('target_id', sa.UUID(), nullable=False),
    sa.Column('target_shift_id', sa.UUID(), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=True),
    sa.Column('reason', sa.Text(), nullable=True),
    sa.Column('admin_id', sa.UUID(), nullable=True),
    sa.Column('admin_comment', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.ForeignKeyConstraint(['admin_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['requester_id'], ['users.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['requester_shift_id'], ['schedule_assignments.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['target_id'], ['users.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['target_shift_id'], ['schedule_assignments.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('shift_swap_requests')
    op.drop_table('system_settings')
    op.drop_table('schedule_assignments')
    op.drop_table('notifications')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_table('users')
    op.drop_table('shifts')
    # ### end Alembic commands ###
